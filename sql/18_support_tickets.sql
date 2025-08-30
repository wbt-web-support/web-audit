-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;

DROP POLICY IF EXISTS "Users can view responses to their tickets" ON support_ticket_responses;
DROP POLICY IF EXISTS "Users can create responses to their tickets" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can create responses to any ticket" ON support_ticket_responses;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS support_ticket_responses CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_ticket_responses table for ticket responses
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_support BOOLEAN NOT NULL DEFAULT false,
    author_name VARCHAR(255) NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id ON support_ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_created_at ON support_ticket_responses(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for support team)
CREATE POLICY "Admins can view all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all tickets" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Create RLS policies for support_ticket_responses
CREATE POLICY "Users can view responses to their tickets" ON support_ticket_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = ticket_id 
            AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create responses to their tickets" ON support_ticket_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = ticket_id 
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Admin policies for responses
CREATE POLICY "Admins can view all responses" ON support_ticket_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create responses to any ticket" ON support_ticket_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

-- Add comments for documentation
COMMENT ON TABLE support_tickets IS 'Support tickets created by users';
COMMENT ON TABLE support_ticket_responses IS 'Responses to support tickets from users and support team';
COMMENT ON COLUMN support_tickets.status IS 'Current status of the ticket: open, in_progress, resolved, closed';
COMMENT ON COLUMN support_tickets.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN support_ticket_responses.is_from_support IS 'Whether the response is from support team (true) or user (false)';
