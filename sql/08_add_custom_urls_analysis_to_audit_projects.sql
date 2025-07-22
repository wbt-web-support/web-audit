ALTER TABLE audit_projects
ADD COLUMN custom_urls_analysis JSONB;

COMMENT ON COLUMN audit_projects.custom_urls_analysis IS 'Stores the result of custom URL presence checks (array of {pageLink, isPresent})'; 