# Backend API Endpoint Diagnostic Prompt

Use this prompt to check if your Fastify backend has the required API endpoints and diagnose connection issues.

## 🔍 **Step 1: Check Backend Server Status**

```bash
# Check if your backend server is running
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","message":"Backend is running"}
```

## 🔍 **Step 2: Test All Required Endpoints**

### **Health Check**
```bash
curl -X GET http://localhost:3001/api/health
```

### **Projects Endpoints**
```bash
# Get projects (requires JWT token)
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Create project (requires JWT token)
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_url": "https://example.com",
    "crawl_type": "full",
    "companyDetails": {
      "companyName": "Test Company"
    }
  }'
```

### **Auth Endpoints**
```bash
# Get user info
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get user tier
curl -X GET http://localhost:3001/api/auth/tier \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get rate limit info
curl -X GET http://localhost:3001/api/auth/rate-limit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 **Step 3: Check Your Fastify Server Setup**

### **Required Server Structure**
```javascript
// server.js or app.js
const fastify = require('fastify')({ logger: true });

// CORS setup
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000'], // Your Next.js frontend URL
  credentials: true
});

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'Backend is running' };
});

// Projects endpoints
fastify.get('/api/projects', async (request, reply) => {
  // Your project listing logic
  return { projects: [], count: 0 };
});

fastify.post('/api/projects', async (request, reply) => {
  // Your project creation logic
  return { 
    project: { id: 'temp-id', base_url: request.body.base_url },
    message: 'Project created successfully'
  };
});

// Auth endpoints
fastify.get('/api/auth/me', async (request, reply) => {
  // Your user info logic
  return { user: { id: 'user-id', email: 'user@example.com' } };
});

fastify.get('/api/auth/tier', async (request, reply) => {
  return { tier: 'BASIC' };
});

fastify.get('/api/auth/rate-limit', async (request, reply) => {
  return { 
    rateLimitInfo: { 
      remaining: 100, 
      resetTime: Date.now() + 3600000,
      burstRemaining: 10,
      burstResetTime: Date.now() + 60000
    }
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

## 🔍 **Step 4: Check Environment Variables**

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Backend (.env)**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔍 **Step 5: Common Issues & Solutions**

### **Issue 1: Server Not Running**
```bash
# Check if port 3001 is in use
netstat -an | grep 3001
# or
lsof -i :3001

# Start your server
node server.js
# or
npm start
```

### **Issue 2: CORS Errors**
```javascript
// Make sure CORS is properly configured
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000'], // Exact match with your frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
```

### **Issue 3: Route Not Found (404)**
```javascript
// Check your route registration order
// Make sure routes are registered before starting the server

// Correct order:
fastify.register(require('@fastify/cors'));
fastify.get('/api/health', handler);
fastify.get('/api/projects', handler);
// ... other routes
fastify.listen({ port: 3001 });
```

### **Issue 4: JWT Token Issues**
```javascript
// Make sure you're validating JWT tokens
fastify.register(require('@fastify/jwt'), {
  secret: 'your-secret-key'
});

// Add authentication to protected routes
fastify.addHook('preHandler', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
```

## 🔍 **Step 6: Debug Commands**

### **Check Server Logs**
```bash
# If using PM2
pm2 logs your-app-name

# If using Docker
docker logs container-name

# If running directly
# Check console output where you started the server
```

### **Test with Browser**
1. Open browser developer tools
2. Go to Network tab
3. Try to create a project
4. Check the failed request details

### **Test with Postman/Insomnia**
1. Create a new request
2. Set URL to `http://localhost:3001/api/health`
3. Set method to GET
4. Send request
5. Check response

## 🔍 **Step 7: Quick Fix Script**

Create this test script to verify all endpoints:

```javascript
// test-endpoints.js
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint}: ${response.status}`);
    console.log('Response:', result);
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing backend endpoints...\n');
  
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/projects');
  await testEndpoint('POST', '/projects', {
    base_url: 'https://example.com',
    crawl_type: 'full'
  });
  await testEndpoint('GET', '/auth/me');
  await testEndpoint('GET', '/auth/tier');
  await testEndpoint('GET', '/auth/rate-limit');
}

runTests();
```

Run with: `node test-endpoints.js`

## 🔍 **Step 8: Expected Results**

### **Working Backend Should Return:**
- `GET /api/health`: `{"status":"ok","message":"Backend is running"}`
- `GET /api/projects`: `{"projects":[],"count":0}` (with auth)
- `POST /api/projects`: `{"project":{...},"message":"Project created successfully"}` (with auth)

### **If You Get 404 Errors:**
- Check route registration
- Verify URL paths match exactly
- Ensure server is running on correct port

### **If You Get CORS Errors:**
- Check CORS configuration
- Verify frontend URL in CORS origin
- Make sure credentials are enabled

## 🚀 **Quick Start Backend**

If you don't have a backend yet, use this minimal setup:

```bash
# Create backend directory
mkdir backend && cd backend

# Initialize npm
npm init -y

# Install dependencies
npm install fastify @fastify/cors @fastify/jwt

# Create server.js with the code from Step 3
# Start server
node server.js
```

This should resolve your "Not Found" errors and get your frontend communicating with the backend properly!
