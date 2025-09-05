# Backend Migration Fixes: Next.js to Fastify

## Critical Issues Found

### 1. **Field Name Mismatch** 🚨
**Problem**: Backend expects `crawlType` (camelCase) but frontend sends `crawl_type` (snake_case)

**Current Backend Code** (line 190 in route.ts):
```typescript
const {
  base_url,
  crawlType = 'full',  // ❌ Expects camelCase
  // ...
} = body;
```

**Fix for Fastify Backend**:
```javascript
// Option 1: Accept both formats
const crawlType = body.crawlType || body.crawl_type || 'full';

// Option 2: Standardize on snake_case (recommended)
const {
  base_url,
  crawl_type = 'full',  // ✅ Use snake_case consistently
  // ...
} = body;
```

### 2. **Array Processing Error** 🚨
**Problem**: Backend tries to call `.map()` on undefined arrays

**Current Issue**: When arrays contain empty strings `[""]`, backend fails with:
```
"Cannot read properties of undefined (reading 'map')"
```

**Fix for Fastify Backend**:
```javascript
// Add proper array validation and cleaning
const cleanArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item && typeof item === 'string' && item.trim());
};

const {
  services = [],
  instructions = [],
  custom_urls = [],
  stripe_key_urls = []
} = body;

// Clean arrays before processing
const cleanServices = cleanArray(services);
const cleanInstructions = cleanArray(instructions);
const cleanCustomUrls = cleanArray(custom_urls);
const cleanStripeKeyUrls = cleanArray(stripe_key_urls);
```

### 3. **Company Details Handling** 🚨
**Problem**: Backend doesn't handle empty company details properly

**Fix for Fastify Backend**:
```javascript
const companyDetails = body.companyDetails || {};
const {
  companyName,
  phoneNumber,
  email,
  address,
  customInfo
} = companyDetails;

// Clean company details
const cleanCompanyDetails = {
  companyName: companyName?.trim() || null,
  phoneNumber: phoneNumber?.trim() || null,
  email: email?.trim() || null,
  address: address?.trim() || null,
  customInfo: customInfo?.trim() || null
};
```

## Fastify Migration Checklist

### 1. **Request Validation Schema**
```javascript
// Use Fastify's built-in validation
const createProjectSchema = {
  body: {
    type: 'object',
    required: ['base_url'],
    properties: {
      base_url: { type: 'string', format: 'uri' },
      crawl_type: { type: 'string', enum: ['full', 'quick', 'custom'] },
      services: { type: 'array', items: { type: 'string' } },
      companyDetails: {
        type: 'object',
        properties: {
          companyName: { type: 'string' },
          phoneNumber: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' },
          customInfo: { type: 'string' }
        }
      },
      instructions: { type: 'array', items: { type: 'string' } },
      custom_urls: { type: 'array', items: { type: 'string', format: 'uri' } },
      stripe_key_urls: { type: 'array', items: { type: 'string', format: 'uri' } }
    }
  }
};
```

### 2. **Error Handling**
```javascript
// Fastify error handling
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.validation
    });
  } else {
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  }
});
```

### 3. **Authentication Middleware**
```javascript
// JWT authentication middleware
const authenticateJWT = async (request, reply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
};
```

### 4. **Rate Limiting**
```javascript
// Use @fastify/rate-limit
await fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
});
```

### 5. **Database Connection**
```javascript
// Supabase client setup for Fastify
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

## Recommended Fastify Route Structure

```javascript
// routes/projects.js
const { createProjectSchema } = require('../schemas/project');

async function projectRoutes(fastify, options) {
  // Create project
  fastify.post('/api/projects', {
    schema: createProjectSchema,
    preHandler: [authenticateJWT, rateLimit]
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

      // Clean and validate data
      const cleanData = {
        base_url: base_url.trim().toLowerCase(),
        crawl_type,
        services: cleanArray(services),
        companyDetails: cleanCompanyDetails(companyDetails),
        instructions: cleanArray(instructions),
        custom_urls: cleanArray(custom_urls),
        stripe_key_urls: cleanArray(stripe_key_urls)
      };

      // Call database function
      const { data: result, error } = await supabase.rpc(
        'create_audit_project_optimized',
        {
          p_user_id: request.user.sub,
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
          p_user_tier: 'BASIC' // TODO: Get from user profile
        }
      );

      if (error) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Database Error',
          message: error.message
        });
      }

      if (!result.success) {
        const statusCode = result.error_code === 'DUPLICATE_URL' ? 409 : 403;
        return reply.status(statusCode).send({
          statusCode,
          error: 'Bad Request',
          message: result.error,
          code: result.error_code
        });
      }

      return reply.status(201).send({
        project: result.project,
        message: 'Project created successfully',
        code: 'SUCCESS'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Something went wrong'
      });
    }
  });
}

module.exports = projectRoutes;
```

## Testing the Migration

### 1. **Test with Current Frontend**
The frontend is now sending clean data, so test with:
```json
{
  "base_url": "https://example.com",
  "crawl_type": "full",
  "services": [],
  "companyDetails": {},
  "instructions": [],
  "custom_urls": [],
  "stripe_key_urls": []
}
```

### 2. **Test Edge Cases**
- Empty arrays: `[]`
- Arrays with empty strings: `[""]`
- Missing fields
- Invalid URLs
- Invalid email formats

### 3. **Performance Testing**
- Rate limiting
- Database connection pooling
- Error handling under load

## Priority Order

1. **High Priority**: Fix field name mismatch and array processing
2. **Medium Priority**: Implement proper validation schemas
3. **Low Priority**: Add comprehensive error handling and logging

This should resolve the current "Cannot read properties of undefined (reading 'map')" error and make your Fastify backend robust! 🚀
