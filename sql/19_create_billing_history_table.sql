-- Create billing_history table for tracking individual payment transactions
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Credit Card',
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_stripe_invoice ON billing_history(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON billing_history(created_at);

-- Enable Row Level Security
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own billing history" 
ON billing_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing history" 
ON billing_history FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing history" 
ON billing_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all billing history" 
ON billing_history FOR ALL 
USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_billing_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_history_updated_at 
  BEFORE UPDATE ON billing_history
  FOR EACH ROW EXECUTE FUNCTION update_billing_history_updated_at();

-- Function to create billing history entry
CREATE OR REPLACE FUNCTION create_billing_history_entry(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_description TEXT,
  p_plan_name TEXT,
  p_billing_period TEXT,
  p_subscription_id UUID DEFAULT NULL,
  p_stripe_invoice_id TEXT DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_status TEXT DEFAULT 'completed',
  p_payment_method TEXT DEFAULT 'Credit Card',
  p_invoice_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  billing_history_id UUID;
BEGIN
  INSERT INTO billing_history (
    user_id,
    subscription_id,
    stripe_invoice_id,
    stripe_payment_intent_id,
    amount,
    currency,
    status,
    description,
    plan_name,
    billing_period,
    payment_method,
    invoice_url
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_stripe_invoice_id,
    p_stripe_payment_intent_id,
    p_amount,
    p_currency,
    p_status,
    p_description,
    p_plan_name,
    p_billing_period,
    p_payment_method,
    p_invoice_url
  ) RETURNING id INTO billing_history_id;
  
  RETURN billing_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
