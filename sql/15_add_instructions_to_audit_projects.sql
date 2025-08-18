-- Add missing fields to audit_projects table
ALTER TABLE audit_projects 
ADD COLUMN instructions TEXT[],
ADD COLUMN custom_urls TEXT[],
ADD COLUMN stripe_key_urls TEXT[];

-- Add helpful comments for the new columns
COMMENT ON COLUMN audit_projects.instructions IS 'Custom instructions to apply during page analysis';
COMMENT ON COLUMN audit_projects.custom_urls IS 'Custom URLs to check during audit';
COMMENT ON COLUMN audit_projects.stripe_key_urls IS 'Stripe key URLs to check during audit';
