-- Add website information fields to audit_projects table
ALTER TABLE audit_projects 
ADD COLUMN company_name TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN email TEXT,
ADD COLUMN address TEXT,
ADD COLUMN custom_info TEXT;

-- Add helpful comments for the new columns
COMMENT ON COLUMN audit_projects.company_name IS 'Expected company name to verify on the website';
COMMENT ON COLUMN audit_projects.phone_number IS 'Expected phone number to verify on the website';
COMMENT ON COLUMN audit_projects.email IS 'Expected email address to verify on the website';
COMMENT ON COLUMN audit_projects.address IS 'Expected address to verify on the website';
COMMENT ON COLUMN audit_projects.custom_info IS 'Additional custom information to verify during audit'; 