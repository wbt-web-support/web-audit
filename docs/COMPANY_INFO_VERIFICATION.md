# Company Information Verification Feature

## Overview

This feature enhances the website audit system by allowing users to specify expected company information when creating an audit session. The AI analysis will then verify whether this information is correctly displayed on the website and flag any discrepancies.

## Feature Components

### 1. Enhanced Session Creation Form

When creating a new audit session, users can now provide:

- **Company Name**: Expected company name to verify on the website
- **Phone Number**: Expected phone number to verify on the website  
- **Email Address**: Expected email address to verify on the website
- **Address**: Expected physical address to verify on the website
- **Additional Information**: Custom field for any other expected information (hours, services, etc.)

### 2. Database Schema

New columns added to the `audit_sessions` table:
- `company_name` (TEXT): Expected company name
- `phone_number` (TEXT): Expected phone number
- `email` (TEXT): Expected email address
- `address` (TEXT): Expected address
- `custom_info` (TEXT): Additional custom information

### 3. Enhanced AI Analysis

The content analysis now includes company information verification:

- **Missing Information Detection**: AI checks if expected company information is present on each page
- **Discrepancy Detection**: AI identifies when website information conflicts with expected information
- **Suggestions**: AI provides specific recommendations for adding missing information or correcting discrepancies

### 4. UI Enhancements

- **Session Creation Form**: Intuitive form with icons for each field type
- **Session Display**: Shows expected company information for easy reference
- **Analysis Results**: Includes company information verification in content analysis reports

## Usage Instructions

### Creating an Audit Session with Company Information

1. Navigate to the Sessions page
2. Fill in the required Website URL
3. Optionally provide expected company information:
   - Company Name: "Acme Corporation"
   - Phone Number: "+1 (555) 123-4567"
   - Email: "contact@example.com"
   - Address: "123 Main St, City, State 12345"
   - Additional Info: "Open Mon-Fri 9-5, Weekend support available"
4. Click "Create Session"

### Understanding Analysis Results

The AI will now check each page for:

- **Presence of expected information**: Is the company name, phone, email, or address displayed?
- **Accuracy of information**: Does the displayed information match what was expected?
- **Completeness**: Are all expected pieces of information present?

#### Example Analysis Output

```json
{
  "issues": [
    "Expected company name 'Acme Corporation' not found on the page",
    "Phone number on page '+1 (555) 999-8888' differs from expected '+1 (555) 123-4567'",
    "Missing email address - expected 'contact@example.com'"
  ],
  "suggestions": [
    "Add the company name 'Acme Corporation' prominently on the page",
    "Verify and correct the phone number to match expected '+1 (555) 123-4567'",
    "Include the email address 'contact@example.com' in the contact section"
  ]
}
```

## Benefits

### For Website Auditors
- **Consistency Verification**: Ensure company information is consistent across all pages
- **Completeness Checking**: Identify pages missing important contact information
- **Brand Compliance**: Verify company name and details are displayed correctly

### For Website Owners
- **Quality Assurance**: Catch inconsistencies in company information before they affect users
- **SEO Benefits**: Ensure consistent NAP (Name, Address, Phone) information across the site
- **User Experience**: Verify users can easily find contact information

## Technical Implementation

### Database Migration

Run the SQL migration to add the new columns:

```sql
-- Run sql/06_add_website_info_to_sessions.sql
ALTER TABLE audit_sessions 
ADD COLUMN company_name TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN email TEXT,
ADD COLUMN address TEXT,
ADD COLUMN custom_info TEXT;
```

### API Endpoints

- **POST /api/audit-sessions**: Now accepts additional company information fields
- **GET /api/audit-sessions**: Returns company information with session data
- **Analysis endpoints**: Enhanced to include company information verification

### Component Updates

- `SessionManager`: Enhanced creation form with company information fields
- `analyzeContentWithGemini`: Enhanced AI prompt to include company verification
- Analysis results display: Shows company information verification results

## Future Enhancements

Potential improvements to this feature:

1. **Multi-language Support**: Verify company information in different languages
2. **Social Media Verification**: Check social media links and handles
3. **Hours/Service Verification**: More sophisticated checking of business hours and services
4. **Location Verification**: Integration with mapping services to verify addresses
5. **Bulk Import**: Allow importing company information from external sources

## Best Practices

### When Providing Company Information

1. **Be Specific**: Provide exact formatting expected (e.g., phone number format)
2. **Include Variations**: Use custom info field for alternative names or common abbreviations
3. **Update Regularly**: Keep expected information current as business details change

### For Analysis Results

1. **Review All Pages**: Some pages may legitimately not include all company information
2. **Context Matters**: Consider page purpose when evaluating missing information
3. **Prioritize Critical Pages**: Focus on contact, about, and landing pages for company information

## Troubleshooting

### Common Issues

1. **Information Not Found**: AI might miss information if it's in images or unusual formats
2. **False Positives**: AI might flag variations or abbreviations as discrepancies
3. **Formatting Differences**: Phone numbers with different formatting might be flagged

### Solutions

1. Use the custom information field to specify alternative formats
2. Review AI suggestions manually for context
3. Consider adding company information in text format alongside images 