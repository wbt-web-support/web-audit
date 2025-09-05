# Backend Project Model Fixes - Specific Issues Found

## 🚨 **Root Cause Analysis**

Your `Project.createProject()` method has several critical issues causing the 500 error:

1. **Missing `user_id` parameter** - Frontend doesn't send it, backend expects it
2. **Error handling masking real errors** - Generic 500 instead of specific errors
3. **JWT token not being extracted** - User ID not available for database function

## 🛠️ **Fixed Project Model Code**

Here's your corrected `Project.createProject()` method:

```javascript
/**
 * Create a new project using optimized database function
 */
static async createProject(projectData, userId) {
  try {
    // Validate required parameters
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    if (!projectData.base_url) {
      throw new Error('base_url is required')
    }

    const {
      base_url,
      crawl_type = CRAWL_TYPES.FULL,
      instructions = [],
      services = [],
      company_name,
      phone_number,
      email,
      address,
      custom_info,
      custom_urls = [],
      stripe_key_urls = [],
      user_tier = 'BASIC'
    } = projectData

    // Clean and validate data
    const cleanBaseUrl = base_url.trim().toLowerCase()
    if (!cleanBaseUrl) {
      throw new Error('base_url cannot be empty')
    }

    // Use the optimized database function
    const functionParams = {
      p_user_id: userId, // Use the userId parameter
      p_base_url: cleanBaseUrl,
      p_crawl_type: crawl_type,
      p_instructions: instructions.length > 0 ? instructions : null,
      p_services: services.length > 0 ? services : null,
      p_company_name: company_name?.trim() || null,
      p_phone_number: phone_number?.trim() || null,
      p_email: email?.trim() || null,
      p_address: address?.trim() || null,
      p_custom_info: custom_info?.trim() || null,
      p_custom_urls: custom_urls.filter(url => url && url.trim()).length > 0 
        ? custom_urls.filter(url => url && url.trim()) 
        : null,
      p_stripe_key_urls: stripe_key_urls.filter(url => url && url.trim()).length > 0 
        ? stripe_key_urls.filter(url => url && url.trim()) 
        : null,
      p_user_tier: user_tier
    }
    
    console.log('Calling create_audit_project_optimized with params:', functionParams)
    
    const { data: result, error } = await supabaseAdmin.rpc('create_audit_project_optimized', functionParams)
    
    console.log('Database function result:', { result, error })

    // Handle database errors properly
    if (error) {
      console.error('Database function error:', error)
      throw new Error(`Database function error: ${error.message}`)
    }

    // Handle function result errors
    if (!result || !result.success) {
      const errorCode = result?.error_code || 'UNKNOWN_ERROR'
      const errorMessage = result?.error || 'Unknown error occurred'
      
      // Return specific error responses instead of throwing
      return {
        success: false,
        error: errorMessage,
        error_code: errorCode,
        project_id: result?.project_id || null,
        current_count: result?.current_count || null,
        max_allowed: result?.max_allowed || null,
        user_tier: result?.user_tier || user_tier
      }
    }

    // Success case
    return {
      success: true,
      project: new Project(result.project)
    }
    
  } catch (error) {
    console.error('Project creation error:', error)
    
    // Don't re-throw, return error response
    return {
      success: false,
      error: error.message,
      error_code: 'CREATION_FAILED'
    }
  }
}
```

## 🔧 **Updated Fastify Route Handler**

Your route handler needs to extract the user ID from the JWT token:

```javascript
// In your Fastify route handler
fastify.post('/api/projects', {
  preHandler: [authenticateJWT]
}, async (request, reply) => {
  try {
    // Extract user ID from authenticated user
    const userId = request.user.id // This should be set by your auth middleware
    
    if (!userId) {
      return reply.status(401).send({
        success: false,
        message: 'User ID not found in token',
        code: 'INVALID_TOKEN'
      })
    }

    // Call the Project model with userId
    const result = await Project.createProject(request.body, userId)
    
    if (!result.success) {
      // Handle specific error codes
      const statusCode = result.error_code === 'DUPLICATE_URL' ? 409 : 
                        result.error_code === 'TOO_MANY_PROJECTS' ? 403 : 400
      
      return reply.status(statusCode).send({
        success: false,
        message: result.error,
        code: result.error_code,
        details: {
          project_id: result.project_id,
          current_count: result.current_count,
          max_allowed: result.max_allowed,
          user_tier: result.user_tier
        }
      })
    }

    // Success response
    return reply.status(201).send({
      success: true,
      project: result.project.toJSON(),
      message: 'Project created successfully',
      code: 'SUCCESS'
    })

  } catch (error) {
    console.error('Route handler error:', error)
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    })
  }
})
```

## 🔐 **Authentication Middleware Fix**

Make sure your authentication middleware sets the user ID:

```javascript
const authenticateJWT = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return reply.status(401).send({ 
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Set user data in request object
    request.user = {
      id: user.user.id,        // This is the user ID you need
      email: user.user.email,
      // ... other user data
    };
    
  } catch (error) {
    return reply.status(401).send({ 
      success: false,
      message: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};
```

## 🧪 **Testing the Fix**

After implementing these fixes, test with:

```javascript
// Test the Project model directly
const testProjectCreation = async () => {
  const projectData = {
    base_url: "https://njdesignpark.com/",
    crawl_type: "full",
    services: [],
    companyDetails: {},
    instructions: [],
    custom_urls: [],
    stripe_key_urls: []
  }
  
  const userId = "your-user-id-here" // Get this from JWT token
  
  const result = await Project.createProject(projectData, userId)
  console.log('Project creation result:', result)
}
```

## ✅ **Expected Results After Fix**

- ✅ **Success**: `201 Created` with project data
- ✅ **Duplicate URL**: `409 Conflict` with specific error message
- ✅ **Too Many Projects**: `403 Forbidden` with limit details
- ✅ **Validation Error**: `400 Bad Request` with specific field errors
- ✅ **Auth Error**: `401 Unauthorized` with token issues

## 🚨 **Key Changes Made**

1. **Added `userId` parameter** to `createProject()` method
2. **Fixed error handling** - return errors instead of throwing
3. **Added proper validation** for required fields
4. **Updated route handler** to extract user ID from JWT
5. **Improved error responses** with specific status codes
6. **Added comprehensive logging** for debugging

The main issue was that your backend expected `user_id` but wasn't getting it from the JWT token. This fix resolves that and provides proper error handling! 🚀
