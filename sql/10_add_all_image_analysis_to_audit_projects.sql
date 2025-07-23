ALTER TABLE audit_projects ADD COLUMN all_image_analysis JSONB;
COMMENT ON COLUMN audit_projects.all_image_analysis IS 'Stores analysis of all images found during crawling: array of {src, size, alt, format, is_small}';
ALTER TABLE audit_projects ADD COLUMN all_links_analysis JSONB;
COMMENT ON COLUMN audit_projects.all_links_analysis IS 'Stores analysis of all links found during crawling: array of {href, type, text, page_url}'; 