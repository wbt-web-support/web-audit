# Project Management Guide

## Overview

The project management system allows you to create, edit, and manage website audit projects. Each project represents an audit of a specific website with defined company information for verification.

## Features

### Creating Projects

1. **Navigate to Projects**: Go to `/projects` to view all your projects
2. **Create New Project**: Click the "Create New Project" button in the header
3. **Fill in Details**: 
   - **Website URL** (required): The base URL to audit
   - **Company Information** (optional):
     - Company Name
     - Phone Number
     - Email Address
     - Address
     - Additional Information
4. **Submit**: Click "Create Project" to start a new audit

### Editing Projects

You can edit project details after creation:

1. **Access Edit**: Click the "Edit" button next to any project
2. **Modify Details**: Update any field including URL and company information
3. **Save Changes**: Click "Save Changes" to update the project

#### Edit Restrictions

- **Running Projects**: Cannot edit projects that are currently crawling or analyzing
- **Ownership**: Can only edit your own projects
- **URL Validation**: Website URL must be valid format

### Project Status

Projects have different statuses that affect available actions:

- **Pending**: Ready to start crawling
- **Crawling**: Currently discovering and downloading pages
- **Analyzing**: Running AI analysis on collected pages
- **Completed**: Analysis finished, results available
- **Failed**: Process encountered an error

### Navigation

The project management interface provides easy navigation:

- **Projects List**: View all your projects at `/projects`
- **Create Project**: Dedicated form at `/projects/create`
- **Edit Project**: Individual edit pages at `/projects/edit/[id]`
- **View Audit**: Go directly to audit results from project list

## API Endpoints

### Project CRUD Operations

- `GET /api/audit-projects` - List user projects
- `POST /api/audit-projects` - Create new project
- `GET /api/audit-projects/[id]` - Get project details
- `PUT /api/audit-projects/[id]` - Update project
- `DELETE /api/audit-projects/[id]` - Delete project

### Security

- All operations require authentication
- Users can only access/modify their own projects
- Running projects cannot be edited
- URL validation prevents invalid inputs

## User Interface

### Projects List Page (`/projects`)

- Clean overview of all projects
- Action buttons for each project:
  - **View Details**: Go to audit results
  - **Edit**: Modify project details (disabled for running projects)
  - **Delete**: Remove project and all data
- **Create New Project** button in header
- Company information display when available

### Create Project Page (`/projects/create`)

- Dedicated form for new project creation
- All company information fields available
- Form validation and error handling
- Cancel option returns to projects list

### Edit Project Page (`/projects/edit/[id]`)

- Pre-populated form with existing project data
- Same fields as create form
- Protection against editing running projects
- Save changes or cancel options

## Best Practices

### Project Organization

1. **Descriptive Information**: Include comprehensive company details for better verification
2. **URL Format**: Always use complete URLs with protocol (https://)
3. **Regular Updates**: Update company information when business details change

### Workflow Efficiency

1. **Batch Creation**: Create multiple projects for different sites/configurations
2. **Edit Before Analysis**: Update company information before starting analysis
3. **Monitor Status**: Check project status before making changes

### Data Management

1. **Regular Cleanup**: Delete old or unnecessary projects
2. **Backup Important Data**: Export or document critical analysis results
3. **Review Settings**: Periodically verify company information accuracy

## Troubleshooting

### Common Issues

1. **Cannot Edit Project**
   - Cause: Project is currently running
   - Solution: Wait for completion or stop the process

2. **Project Not Found**
   - Cause: Invalid project ID or permission issue
   - Solution: Verify project ownership and ID

3. **Invalid URL Format**
   - Cause: Malformed website URL
   - Solution: Use complete URL with protocol

### Error Messages

- `Cannot edit project while it is running` - Project must be stopped first
- `Project not found` - Invalid ID or insufficient permissions
- `Invalid URL format` - URL must include protocol and be well-formed

## Migration from Old Interface

The new project management system replaces the inline form with dedicated pages:

### What Changed

- **Create Form**: Moved from main page to dedicated `/projects/create` page
- **Edit Capability**: New feature allowing modification of existing projects
- **Improved UI**: Cleaner project list without embedded form
- **Better Navigation**: Clear separation between list, create, and edit functions

### Migration Steps

1. Existing projects continue to work normally
2. No data migration required
3. New company information fields are optional
4. Old workflows remain compatible

## Technical Details

### Component Structure

- `ProjectManager`: Main projects list component
- `ProjectForm`: Reusable form for create/edit operations
- Dedicated pages for create and edit workflows

### Data Validation

- Client-side validation for immediate feedback
- Server-side validation for security
- URL format checking
- Running project protection

### State Management

- Form state managed locally in components
- Project list updated after operations
- Error handling with user feedback
- Loading states for better UX 