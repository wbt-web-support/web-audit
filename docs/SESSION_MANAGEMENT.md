# Session Management Guide

## Overview

The session management system allows you to create, edit, and manage website audit sessions. Each session represents an audit of a specific website with defined company information for verification.

## Features

### Creating Sessions

1. **Navigate to Sessions**: Go to `/sessions` to view all your sessions
2. **Create New Session**: Click the "Create New Session" button in the header
3. **Fill in Details**: 
   - **Website URL** (required): The base URL to audit
   - **Company Information** (optional):
     - Company Name
     - Phone Number
     - Email Address
     - Address
     - Additional Information
4. **Submit**: Click "Create Session" to start a new audit

### Editing Sessions

You can edit session details after creation:

1. **Access Edit**: Click the "Edit" button next to any session
2. **Modify Details**: Update any field including URL and company information
3. **Save Changes**: Click "Save Changes" to update the session

#### Edit Restrictions

- **Running Sessions**: Cannot edit sessions that are currently crawling or analyzing
- **Ownership**: Can only edit your own sessions
- **URL Validation**: Website URL must be valid format

### Session Status

Sessions have different statuses that affect available actions:

- **Pending**: Ready to start crawling
- **Crawling**: Currently discovering and downloading pages
- **Analyzing**: Running AI analysis on collected pages
- **Completed**: Analysis finished, results available
- **Failed**: Process encountered an error

### Navigation

The session management interface provides easy navigation:

- **Sessions List**: View all your sessions at `/sessions`
- **Create Session**: Dedicated form at `/sessions/create`
- **Edit Session**: Individual edit pages at `/sessions/edit/[id]`
- **View Audit**: Go directly to audit results from session list

## API Endpoints

### Session CRUD Operations

- `GET /api/audit-sessions` - List user sessions
- `POST /api/audit-sessions` - Create new session
- `GET /api/audit-sessions/[id]` - Get session details
- `PUT /api/audit-sessions/[id]` - Update session
- `DELETE /api/audit-sessions/[id]` - Delete session

### Security

- All operations require authentication
- Users can only access/modify their own sessions
- Running sessions cannot be edited
- URL validation prevents invalid inputs

## User Interface

### Sessions List Page (`/sessions`)

- Clean overview of all sessions
- Action buttons for each session:
  - **View Details**: Go to audit results
  - **Edit**: Modify session details (disabled for running sessions)
  - **Delete**: Remove session and all data
- **Create New Session** button in header
- Company information display when available

### Create Session Page (`/sessions/create`)

- Dedicated form for new session creation
- All company information fields available
- Form validation and error handling
- Cancel option returns to sessions list

### Edit Session Page (`/sessions/edit/[id]`)

- Pre-populated form with existing session data
- Same fields as create form
- Protection against editing running sessions
- Save changes or cancel options

## Best Practices

### Session Organization

1. **Descriptive Information**: Include comprehensive company details for better verification
2. **URL Format**: Always use complete URLs with protocol (https://)
3. **Regular Updates**: Update company information when business details change

### Workflow Efficiency

1. **Batch Creation**: Create multiple sessions for different sites/configurations
2. **Edit Before Analysis**: Update company information before starting analysis
3. **Monitor Status**: Check session status before making changes

### Data Management

1. **Regular Cleanup**: Delete old or unnecessary sessions
2. **Backup Important Data**: Export or document critical analysis results
3. **Review Settings**: Periodically verify company information accuracy

## Troubleshooting

### Common Issues

1. **Cannot Edit Session**
   - Cause: Session is currently running
   - Solution: Wait for completion or stop the process

2. **Session Not Found**
   - Cause: Invalid session ID or permission issue
   - Solution: Verify session ownership and ID

3. **Invalid URL Format**
   - Cause: Malformed website URL
   - Solution: Use complete URL with protocol

### Error Messages

- `Cannot edit session while it is running` - Session must be stopped first
- `Session not found` - Invalid ID or insufficient permissions
- `Invalid URL format` - URL must include protocol and be well-formed

## Migration from Old Interface

The new session management system replaces the inline form with dedicated pages:

### What Changed

- **Create Form**: Moved from main page to dedicated `/sessions/create` page
- **Edit Capability**: New feature allowing modification of existing sessions
- **Improved UI**: Cleaner session list without embedded form
- **Better Navigation**: Clear separation between list, create, and edit functions

### Migration Steps

1. Existing sessions continue to work normally
2. No data migration required
3. New company information fields are optional
4. Old workflows remain compatible

## Technical Details

### Component Structure

- `SessionManager`: Main sessions list component
- `SessionForm`: Reusable form for create/edit operations
- Dedicated pages for create and edit workflows

### Data Validation

- Client-side validation for immediate feedback
- Server-side validation for security
- URL format checking
- Running session protection

### State Management

- Form state managed locally in components
- Session list updated after operations
- Error handling with user feedback
- Loading states for better UX 