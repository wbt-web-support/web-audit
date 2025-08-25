import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('Testing database connection...');

    // Test 1: Check if user_subscriptions table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return NextResponse.json({ 
        error: 'Table access failed', 
        details: tableError 
      }, { status: 500 });
    }

    console.log('✅ Table access successful:', tableTest);

    // Test 2: Check table structure
    const { data: structureTest, error: structureError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('❌ Structure test error:', structureError);
      return NextResponse.json({ 
        error: 'Structure test failed', 
        details: structureError 
      }, { status: 500 });
    }

    console.log('✅ Structure test successful');

    // Test 3: Check if we can insert a test record (then delete it)
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      stripe_subscription_id: `test_${Date.now()}`,
      plan_id: 'test_plan',
      billing_period: 'month',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('Testing insert with data:', testData);

    const { data: insertTest, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test error:', insertError);
      return NextResponse.json({ 
        error: 'Insert test failed', 
        details: insertError,
        testData 
      }, { status: 500 });
    }

    console.log('✅ Insert test successful:', insertTest);

    // Clean up test record
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('stripe_subscription_id', testData.stripe_subscription_id);

    if (deleteError) {
      console.error('⚠️ Cleanup error (non-critical):', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }

    // Test 4: Check user_profiles table
    const { data: profileTest, error: profileError } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);

    if (profileError) {
      console.error('❌ Profile table error:', profileError);
    } else {
      console.log('✅ Profile table access successful:', profileTest);
    }

    // Test 5: Check billing_history table
    const { data: billingTest, error: billingError } = await supabase
      .from('billing_history')
      .select('count(*)')
      .limit(1);

    if (billingError) {
      console.error('❌ Billing table error:', billingError);
    } else {
      console.log('✅ Billing table access successful:', billingTest);
    }

    return NextResponse.json({
      success: true,
      message: 'Database tests completed successfully',
      results: {
        user_subscriptions: '✅ Accessible',
        user_profiles: profileError ? '❌ Error' : '✅ Accessible',
        billing_history: billingError ? '❌ Error' : '✅ Accessible',
        insert_test: '✅ Successful',
        cleanup: deleteError ? '⚠️ Warning' : '✅ Successful'
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error },
      { status: 500 }
    );
  }
}
