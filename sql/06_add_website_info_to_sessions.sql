-- Add website information fields to audit_sessions table
ALTER TABLE audit_sessions 
ADD COLUMN company_name TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN email TEXT,
ADD COLUMN address TEXT,
ADD COLUMN custom_info TEXT;

-- Add helpful comments for the new columns
COMMENT ON COLUMN audit_sessions.company_name IS 'Expected company name to verify on the website';
COMMENT ON COLUMN audit_sessions.phone_number IS 'Expected phone number to verify on the website';
COMMENT ON COLUMN audit_sessions.email IS 'Expected email address to verify on the website';
COMMENT ON COLUMN audit_sessions.address IS 'Expected address to verify on the website';
COMMENT ON COLUMN audit_sessions.custom_info IS 'Additional custom information to verify during audit'; 