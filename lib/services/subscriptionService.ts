import { createServiceRoleClient } from '@/lib/supabase/server';
import { 
  UserSubscription, 
  CreateSubscriptionRequest, 
  SwitchActivePlanRequest,
  PlanName,
  BillingCycle 
} from '@/lib/types/database';

export class SubscriptionService {
  private supabase = createServiceRoleClient();

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string, 
    request: CreateSubscriptionRequest
  ): Promise<UserSubscription> {
    const { plan_name, billing_cycle, activate_immediately = false } = request;

    // Validate plan name
    if (!['Enterprise', 'Professional', 'Starter'].includes(plan_name)) {
      throw new Error('Invalid plan name');
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      throw new Error('Invalid billing cycle');
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (billing_cycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // If activating immediately, deactivate all other subscriptions first
    if (activate_immediately) {
      await this.supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);
    }

    // Create the new subscription
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_name,
        billing_cycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: activate_immediately
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get the currently active subscription for a user
   */
  async getActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active subscription found
        return null;
      }
      console.error('Error fetching active subscription:', error);
      throw new Error(`Failed to fetch active subscription: ${error.message}`);
    }

    return data;
  }

  /**
   * Switch the active subscription for a user
   */
  async switchActivePlan(
    userId: string, 
    request: SwitchActivePlanRequest
  ): Promise<UserSubscription> {
    const { subscription_id } = request;

    // First, verify the subscription belongs to the user
    const { data: subscription, error: fetchError } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      throw new Error('Subscription not found or does not belong to user');
    }

    // Deactivate all other subscriptions for this user
    const { error: deactivateError } = await this.supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (deactivateError) {
      console.error('Error deactivating subscriptions:', deactivateError);
      throw new Error(`Failed to deactivate subscriptions: ${deactivateError.message}`);
    }

    // Activate the selected subscription
    const { data: updatedSubscription, error: activateError } = await this.supabase
      .from('user_subscriptions')
      .update({ is_active: true })
      .eq('id', subscription_id)
      .select()
      .single();

    if (activateError) {
      console.error('Error activating subscription:', activateError);
      throw new Error(`Failed to activate subscription: ${activateError.message}`);
    }

    return updatedSubscription;
  }

  /**
   * Check if a user has a specific plan
   */
  async hasPlan(userId: string, planName: PlanName): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_name', planName)
      .limit(1);

    if (error) {
      console.error('Error checking plan ownership:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Check if a user has an active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const activeSubscription = await this.getActiveSubscription(userId);
    return activeSubscription !== null;
  }

  /**
   * Get subscription count for a user
   */
  async getSubscriptionCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting subscriptions:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Delete a subscription (for admin purposes)
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error deleting subscription:', error);
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();
