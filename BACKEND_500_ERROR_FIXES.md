# Backend 500 Error Fixes - Complete Guide

## 🚨 Current Issue
**Error**: `500 Internal Server Error` when creating projects
**Response**: `{"success":false,"message":"Failed to create project","code":"INTERNAL_ERROR","details":null,"statusCode":500}`

## 🔍 Root Cause Analysis

The frontend is now working perfectly and sending clean data:
```json
{
  "base_url": "https://njdesignpark.com/",
  "crawl_type": "full",
  "services": [],
  "companyDetails": {},
  "instructions": [],
  "custom_urls": [],
  "stripe_key_urls": []
}
```

The 500 error indicates a server-side issue in your Fastify backend.

## 🛠️ Required Backend Fixes

### 1. **Database Connection Issues** 🚨 HIGH PRIORITY

#### Problem: Supabase Client Not Configured
```javascript
// ❌ Current (likely broken)
const supabase = createClient(url, key);

// ✅ Fix: Proper Supabase client setup
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);
```

#### Environment Variables Check
```env
# Required environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
```

### 2. **Database Function Issues** 🚨 HIGH PRIORITY

#### Problem: Missing Database Function
The error suggests the `create_audit_project_optimized` function might not exist.

#### Fix: Create Database Function
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'create_audit_project_optimized';

-- If not exists, create it:
CREATE OR REPLACE FUNCTION create_audit_project_optimized(
  p_user_id UUID,
  p_base_url TEXT,
  p_crawl_type VARCHAR(20) DEFAULT 'full',
  p_instructions JSONB DEFAULT NULL,
  p_services JSONB DEFAULT NULL,
  p_company_name VARCHAR(255) DEFAULT NULL,
  p_phone_number VARCHAR(50) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_custom_info TEXT DEFAULT NULL,
  p_custom_urls JSONB DEFAULT NULL,
  p_stripe_key_urls JSONB DEFAULT NULL,
  p_user_tier VARCHAR(20) DEFAULT 'BASIC'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_tier_config JSONB;
  v_current_count INTEGER;
  v_max_projects INTEGER;
  v_existing_project_id UUID;
  v_new_project_id UUID;
  v_result JSONB;
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists, create if not
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Create profile from auth.users data
    INSERT INTO profiles (id, email, name, tier)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', au.email),
      p_user_tier
    FROM auth.users au
    WHERE au.id = p_user_id;
  END IF;
  
  -- Get user tier configuration
  v_user_tier_config := CASE p_user_tier
    WHEN 'BASIC' THEN '{"maxProjects": 5}'::jsonb
    WHEN 'PRO' THEN '{"maxProjects": 50}'::jsonb
    WHEN 'ENTERPRISE' THEN '{"maxProjects": 500}'::jsonb
    ELSE '{"maxProjects": 5}'::jsonb
  END;
  
  v_max_projects := (v_user_tier_config->>'maxProjects')::INTEGER;
  
  -- Check for duplicate URL
  SELECT id INTO v_existing_project_id
  FROM audit_projects
  WHERE user_id = p_user_id AND base_url = LOWER(TRIM(p_base_url));
  
  IF v_existing_project_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A project with this URL already exists',
      'error_code', 'DUPLICATE_URL',
      'project_id', v_existing_project_id
    );
  END IF;
  
  -- Check project count limit
  SELECT COUNT(*) INTO v_current_count
  FROM audit_projects
  WHERE user_id = p_user_id;
  
  IF v_current_count >= v_max_projects THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project limit exceeded for your tier',
      'error_code', 'TOO_MANY_PROJECTS',
      'current_count', v_current_count,
      'max_allowed', v_max_projects,
      'user_tier', p_user_tier
    );
  END IF;
  
  -- Create the project
  INSERT INTO audit_projects (
    user_id, base_url, crawl_type, instructions, services,
    company_name, phone_number, email, address, custom_info,
    custom_urls, stripe_key_urls
  ) VALUES (
    p_user_id, LOWER(TRIM(p_base_url)), p_crawl_type, p_instructions, p_services,
    p_company_name, p_phone_number, p_email, p_address, p_custom_info,
    p_custom_urls, p_stripe_key_urls
  ) RETURNING id INTO v_new_project_id;
  
  -- Get the created project
  SELECT to_jsonb(ap.*) INTO v_result
  FROM audit_projects ap
  WHERE ap.id = v_new_project_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'project', v_result
  );
END;
$$;
```

### 3. **Authentication Issues** 🚨 HIGH PRIORITY

#### Problem: JWT Token Validation
```javascript
// ❌ Current (likely broken)
const token = request.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ✅ Fix: Proper JWT validation with error handling
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return reply.status(401).send({ 
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    request.user = user;
  } catch (error) {
    return reply.status(401).send({ 
      success: false,
      message: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};
```

### 4. **Field Name Mismatch** 🚨 MEDIUM PRIORITY

#### Problem: Backend expects different field names
```javascript
// ❌ Current (if using camelCase)
const {
  base_url,
  crawlType = 'full', // Wrong field name
  // ...
} = request.body;

// ✅ Fix: Use snake_case consistently
const {
  base_url,
  crawl_type = 'full', // Correct field name
  services = [],
  companyDetails = {},
  instructions = [],
  custom_urls = [],
  stripe_key_urls = []
} = request.body;
```

### 5. **Error Handling Issues** 🚨 MEDIUM PRIORITY

#### Problem: Generic error responses
```javascript
// ❌ Current (likely)
catch (error) {
  return reply.status(500).send({
    success: false,
    message: 'Failed to create project',
    code: 'INTERNAL_ERROR',
    details: null
  });
}

// ✅ Fix: Detailed error handling
catch (error) {
  console.error('Project creation error:', error);
  
  // Database errors
  if (error.code === '23505') { // Unique violation
    return reply.status(409).send({
      success: false,
      message: 'Project with this URL already exists',
      code: 'DUPLICATE_URL'
    });
  }
  
  // Validation errors
  if (error.code === '23514') { // Check violation
    return reply.status(400).send({
      success: false,
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }
  
  // Generic error
  return reply.status(500).send({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : null
  });
}
```

### 6. **Database Schema Issues** 🚨 MEDIUM PRIORITY

#### Problem: Missing tables or columns
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_projects', 'profiles');

-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'audit_projects' 
AND column_name IN ('user_id', 'base_url', 'crawl_type');
```

#### Fix: Create missing tables
```sql
-- Create profiles table if missing
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  tier VARCHAR(20) DEFAULT 'BASIC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_projects table if missing
CREATE TABLE IF NOT EXISTS audit_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  base_url TEXT NOT NULL,
  crawl_type VARCHAR(20) DEFAULT 'full',
  instructions JSONB,
  services JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  company_name VARCHAR(255),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  custom_info TEXT,
  custom_urls JSONB,
  stripe_key_urls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Complete Fastify Route Fix

```javascript
// routes/projects.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Authentication middleware
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
    
    request.user = user;
  } catch (error) {
    return reply.status(401).send({ 
      success: false,
      message: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Create project route
fastify.post('/api/projects', {
  preHandler: [authenticateJWT]
}, async (request, reply) => {
  try {
    const {
      base_url,
      crawl_type = 'full',
      services = [],
      companyDetails = {},
      instructions = [],
      custom_urls = [],
      stripe_key_urls = []
    } = request.body;

    // Validate required fields
    if (!base_url || typeof base_url !== 'string') {
      return reply.status(400).send({
        success: false,
        message: 'base_url is required and must be a string',
        code: 'VALIDATION_ERROR'
      });
    }

    // Clean data
    const cleanData = {
      base_url: base_url.trim().toLowerCase(),
      crawl_type,
      services: Array.isArray(services) ? services.filter(s => s && s.trim()) : [],
      instructions: Array.isArray(instructions) ? instructions.filter(i => i && i.trim()) : [],
      custom_urls: Array.isArray(custom_urls) ? custom_urls.filter(u => u && u.trim()) : [],
      stripe_key_urls: Array.isArray(stripe_key_urls) ? stripe_key_urls.filter(u => u && u.trim()) : [],
      companyDetails: {
        companyName: companyDetails.companyName?.trim() || null,
        phoneNumber: companyDetails.phoneNumber?.trim() || null,
        email: companyDetails.email?.trim() || null,
        address: companyDetails.address?.trim() || null,
        customInfo: companyDetails.customInfo?.trim() || null
      }
    };

    // Call database function
    const { data: result, error: dbError } = await supabase.rpc('create_audit_project_optimized', {
      p_user_id: request.user.id,
      p_base_url: cleanData.base_url,
      p_crawl_type: cleanData.crawl_type,
      p_instructions: cleanData.instructions.length > 0 ? cleanData.instructions : null,
      p_services: cleanData.services.length > 0 ? cleanData.services : null,
      p_company_name: cleanData.companyDetails.companyName,
      p_phone_number: cleanData.companyDetails.phoneNumber,
      p_email: cleanData.companyDetails.email,
      p_address: cleanData.companyDetails.address,
      p_custom_info: cleanData.companyDetails.customInfo,
      p_custom_urls: cleanData.custom_urls.length > 0 ? cleanData.custom_urls : null,
      p_stripe_key_urls: cleanData.stripe_key_urls.length > 0 ? cleanData.stripe_key_urls : null,
      p_user_tier: 'BASIC'
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return reply.status(500).send({
        success: false,
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? dbError.message : null
      });
    }

    if (!result.success) {
      const statusCode = result.error_code === 'DUPLICATE_URL' ? 409 : 403;
      return reply.status(statusCode).send({
        success: false,
        message: result.error,
        code: result.error_code
      });
    }

    return reply.status(201).send({
      success: true,
      project: result.project,
      message: 'Project created successfully',
      code: 'SUCCESS'
    });

  } catch (error) {
    console.error('Project creation error:', error);
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
```

## 🧪 Testing Steps

### 1. **Test Database Connection**
```javascript
// Add this to your backend for testing
const testDatabase = async () => {
  try {
    const { data, error } = await supabase.from('audit_projects').select('count').limit(1);
    console.log('Database test:', { data, error });
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

### 2. **Test JWT Authentication**
```javascript
// Test token validation
const testAuth = async (token) => {
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    console.log('Auth test:', { user: user?.user?.email, error });
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};
```

### 3. **Test Database Function**
```sql
-- Test the function directly
SELECT create_audit_project_optimized(
  'your-user-id'::uuid,
  'https://test.com',
  'full',
  '["test instruction"]'::jsonb,
  '["seo"]'::jsonb,
  'Test Company',
  null,
  'test@example.com',
  null,
  null,
  null,
  null,
  'BASIC'
);
```

## 📋 Priority Order

1. **🚨 HIGH**: Fix database connection and function
2. **🚨 HIGH**: Fix JWT authentication
3. **🚨 MEDIUM**: Fix field name mismatches
4. **🚨 MEDIUM**: Add proper error handling
5. **🚨 LOW**: Add comprehensive logging

## ✅ Success Criteria

After implementing these fixes, you should see:
- ✅ `201 Created` response for successful project creation
- ✅ Proper error messages for validation failures
- ✅ Clean database operations
- ✅ Working authentication

The frontend is already perfect - these backend fixes will resolve the 500 error! 🚀
