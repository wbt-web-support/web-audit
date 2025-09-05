# Migration Guide: Next.js Frontend to Fastify Backend

This guide explains how to migrate your Next.js frontend to work with a Fastify backend while maintaining Supabase authentication.

## 🎯 Overview

The migration maintains your existing Supabase authentication system while redirecting all API calls to your new Fastify backend. The JWT tokens from Supabase are automatically included in all backend requests.

## 📁 New Files Created

### Core API Integration
- `lib/api-client.ts` - Main API client for Fastify backend communication
- `lib/config/backend.ts` - Backend configuration and URL management
- `lib/hooks/useAuthWithBackend.ts` - Enhanced auth hook with backend integration
- `lib/hooks/useProjects.ts` - Project management hook using new API client

### Demo Components
- `components/auth/auth-demo.tsx` - Authentication demo component
- `components/projects/project-demo.tsx` - Project management demo component
- `app/demo/page.tsx` - Complete demo page showcasing the integration

## 🔧 Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Existing Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# New backend configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
```

### 2. Backend Configuration

Update `lib/config/backend.ts` to point to your Fastify server:

```typescript
export const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api',
  // ... other config
};
```

## 🔄 Authentication Flow

### How It Works

1. **User Authentication**: Users sign up/sign in through Supabase (unchanged)
2. **JWT Token**: Supabase provides JWT tokens automatically
3. **API Calls**: All backend API calls include the JWT token in the Authorization header
4. **Backend Validation**: Your Fastify backend validates the JWT token with Supabase
5. **User Management**: Backend creates user records on first API call

### Key Components

#### API Client (`lib/api-client.ts`)
```typescript
// Automatically includes JWT token in all requests
const response = await apiClient.createProject(projectData);
```

#### Enhanced Auth Hook (`lib/hooks/useAuthWithBackend.ts`)
```typescript
const { user, isAuthenticated, userTier, rateLimitInfo } = useAuthWithBackend();
```

#### Project Management Hook (`lib/hooks/useProjects.ts`)
```typescript
const { projects, createProject, updateProject, deleteProject } = useProjects();
```

## 🚀 Usage Examples

### Basic Authentication
```typescript
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuthWithBackend();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <Dashboard user={user} />;
}
```

### Project Management
```typescript
import { useProjects } from '@/lib/hooks/useProjects';

function ProjectManager() {
  const { projects, createProject, loading, error } = useProjects();
  
  const handleCreate = async () => {
    const success = await createProject({
      base_url: 'https://example.com',
      crawl_type: 'full',
      companyDetails: { companyName: 'My Company' }
    });
    
    if (success) {
      console.log('Project created!');
    }
  };
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### Direct API Calls
```typescript
import { apiClient } from '@/lib/api-client';

// All these calls automatically include JWT token
const projects = await apiClient.getProjects();
const project = await apiClient.getProject('project-id');
const userInfo = await apiClient.getUserInfo();
```

## 🔄 Updated Components

### Project Form (`components/audit/project-form.tsx`)
- Now uses `useProjects()` hook instead of direct fetch calls
- Simplified error handling
- Automatic JWT token inclusion

### Providers (`app/providers.tsx`)
- Added `AuthProvider` wrapper for enhanced authentication context

## 🧪 Testing the Integration

### 1. Demo Page
Visit `/demo` to see the complete integration in action:
- Authentication flow
- Project management
- User tier and rate limit information

### 2. Health Check
```typescript
import { apiClient } from '@/lib/api-client';

// Check if backend is accessible
const health = await apiClient.healthCheck();
console.log(health);
```

### 3. Authentication Test
```typescript
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend';

function TestAuth() {
  const { user, userTier, rateLimitInfo } = useAuthWithBackend();
  
  console.log('User:', user);
  console.log('Tier:', userTier);
  console.log('Rate Limit:', rateLimitInfo);
}
```

## 🔧 Backend Requirements

Your Fastify backend should:

1. **Accept JWT Tokens**: Expect `Authorization: Bearer <token>` header
2. **Validate with Supabase**: Verify JWT tokens with Supabase
3. **Provide Endpoints**:
   - `GET /projects` - List user projects
   - `POST /projects` - Create new project
   - `GET /projects/:id` - Get specific project
   - `PUT /projects/:id` - Update project
   - `DELETE /projects/:id` - Delete project
   - `GET /auth/me` - Get user info
   - `GET /auth/tier` - Get user tier
   - `GET /auth/rate-limit` - Get rate limit info
   - `GET /health` - Health check

4. **Handle Errors**: Return consistent error responses
5. **Create Users**: Create user records on first API call

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your Fastify backend allows requests from your frontend domain
   - Configure CORS properly in Fastify

2. **Authentication Errors**
   - Verify Supabase configuration
   - Check JWT token format in backend
   - Ensure backend validates tokens with Supabase

3. **API Connection Issues**
   - Verify `NEXT_PUBLIC_BACKEND_URL` is correct
   - Check if Fastify backend is running
   - Test with health check endpoint

4. **Rate Limiting**
   - Check rate limit responses from backend
   - Verify user tier information is returned

### Debug Mode

Enable debug logging:
```typescript
// In your component
console.log('Auth state:', { user, isAuthenticated, userTier });
console.log('API response:', await apiClient.getProjects());
```

## 📈 Benefits

1. **Seamless Migration**: Keep existing Supabase auth, just change API calls
2. **Type Safety**: Full TypeScript support for all API calls
3. **Error Handling**: Consistent error handling across all components
4. **Automatic Token Management**: JWT tokens handled automatically
5. **User Experience**: No changes to user authentication flow
6. **Scalability**: Easy to add new API endpoints and features

## 🔄 Migration Checklist

- [ ] Set up environment variables
- [ ] Configure backend URL
- [ ] Test authentication flow
- [ ] Test project creation/management
- [ ] Verify error handling
- [ ] Test with different user tiers
- [ ] Check rate limiting
- [ ] Update any custom components using old API calls
- [ ] Deploy and test in production

## 🎉 Next Steps

1. **Test the Demo**: Visit `/demo` to see everything working
2. **Update Components**: Gradually migrate other components to use the new hooks
3. **Add Features**: Use the API client to add new backend features
4. **Monitor**: Watch for any authentication or API issues
5. **Optimize**: Fine-tune error handling and user experience

The migration is complete! Your Next.js frontend now seamlessly communicates with your Fastify backend while maintaining the familiar Supabase authentication experience.
