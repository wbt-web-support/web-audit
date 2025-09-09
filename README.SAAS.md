# SaaS Web Audit Platform

A scalable, multi-tenant web crawling and analysis platform designed to handle 500+ concurrent users with proper tenant isolation, resource management, and comprehensive monitoring.

## 🏗️ Architecture

### Multi-Tenant SaaS Design
- **Tenant Isolation**: Complete data and resource isolation between tenants
- **Resource Management**: Per-tenant limits and usage tracking
- **Queue System**: BullMQ with Redis for scalable job processing
- **Rate Limiting**: Per-tenant rate limiting with configurable quotas
- **Monitoring**: Comprehensive system and tenant-level monitoring

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes with Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Queue**: BullMQ with Redis
- **Authentication**: Supabase Auth
- **Monitoring**: Prometheus + Grafana
- **Logging**: Elasticsearch + Kibana
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd web-audit-saas
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/web_audit_saas
REDIS_URL=redis://localhost:6379

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
JWT_SECRET=your-secure-jwt-secret

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

4. **Initialize the database**
```bash
# Run the SaaS schema creation script
psql -d web_audit_saas -f scripts/create-saas-schema.sql
```

5. **Start the development environment**
```bash
# Start all services
docker-compose -f docker-compose.saas.yml up -d

# Or start individual services
npm run dev          # Next.js app
npm run start:workers # Queue workers
```

## 📁 Project Structure

```
├── lib/saas/                    # SaaS core modules
│   ├── types/                   # TypeScript type definitions
│   ├── core/                    # Core SaaS functionality
│   │   ├── tenant-manager.ts    # Tenant management
│   │   └── rate-limiter.ts      # Rate limiting
│   ├── queue/                   # Queue management
│   │   └── tenant-queue-manager.ts
│   ├── services/                # Business logic services
│   │   └── tenant-web-scraper.ts
│   ├── monitoring/              # Monitoring and analytics
│   │   └── system-monitor.ts
│   └── config/                  # Configuration management
│       └── saas-config.ts
├── components/saas/             # SaaS-specific components
│   ├── audit/                   # Audit components
│   └── components/              # Reusable components
├── app/api/saas/                # SaaS API routes
│   ├── tenants/                 # Tenant management APIs
│   └── admin/                   # Admin APIs
├── scripts/                     # Database and utility scripts
│   └── create-saas-schema.sql
├── docs/                        # Documentation
│   └── API.md
└── monitoring/                  # Monitoring configuration
    ├── prometheus.yml
    └── grafana/
```

## 🏢 Multi-Tenancy

### Tenant Management
- **Tenant Creation**: Automatic tenant creation with default settings
- **Plan Management**: Subscription plans with configurable limits
- **Usage Tracking**: Real-time usage monitoring and limits enforcement
- **Resource Isolation**: Complete data and resource separation

### Subscription Plans

| Plan | Projects | Pages/Project | Concurrent Crawls | Workers | Rate Limit | Storage |
|------|----------|---------------|-------------------|---------|------------|---------|
| Free | 3 | 50 | 1 | 2 | 60/min | 1GB |
| Starter | 10 | 200 | 3 | 5 | 300/min | 10GB |
| Professional | 50 | 1000 | 10 | 20 | 1000/min | 100GB |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |

## 🔧 Configuration

### SaaS Configuration
The system uses a centralized configuration system in `lib/saas/config/saas-config.ts`:

```typescript
import { saasConfig } from '@/lib/saas/config/saas-config';

// Access configuration
console.log(saasConfig.system.name);
console.log(saasConfig.tenant.maxTenants);
console.log(saasConfig.features.multiTenancy);
```

### Environment Variables
All configuration can be overridden via environment variables:

```env
# System
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=30000

# Queue
QUEUE_DEFAULT_CONCURRENCY=5
QUEUE_DEFAULT_MAX_WORKERS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Features
FEATURE_MULTI_TENANCY=true
FEATURE_QUEUE_SYSTEM=true
FEATURE_RATE_LIMITING=true
```

## 📊 Monitoring & Analytics

### System Monitoring
- **Health Checks**: Automated health monitoring for all services
- **Performance Metrics**: CPU, memory, disk usage tracking
- **Queue Monitoring**: Job processing statistics and performance
- **Error Tracking**: Comprehensive error logging and alerting

### Tenant Analytics
- **Usage Analytics**: Per-tenant resource utilization
- **Performance Metrics**: Crawl times, success rates, error rates
- **Billing Analytics**: Usage-based billing calculations
- **Growth Metrics**: Tenant acquisition and retention

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Elasticsearch**: Log aggregation and search
- **Kibana**: Log analysis and visualization

## 🔒 Security

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Role-Based Access**: Owner, Admin, Member, Viewer roles
- **Tenant Isolation**: Complete data separation
- **API Security**: Rate limiting and request validation

### Data Protection
- **Row Level Security**: Database-level access control
- **Encryption**: Data encryption at rest and in transit
- **Audit Logging**: Complete audit trail for compliance
- **GDPR Compliance**: Data privacy and deletion capabilities

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.saas.yml up -d

# Scale workers
docker-compose -f docker-compose.saas.yml up -d --scale workers=5

# View logs
docker-compose -f docker-compose.saas.yml logs -f app
```

### Production Considerations
- **Load Balancing**: Use nginx or cloud load balancer
- **SSL/TLS**: Configure SSL certificates
- **Backup Strategy**: Regular database and file backups
- **Monitoring**: Set up alerting and monitoring
- **Scaling**: Horizontal scaling for workers and app instances

### Environment-Specific Configs
- **Development**: Debug mode, relaxed limits
- **Staging**: Production-like with monitoring
- **Production**: Full security and performance optimizations

## 📈 Scaling for 500+ Users

### Performance Optimizations
- **Connection Pooling**: Database connection optimization
- **Caching**: Redis-based caching for tenant data
- **Queue Optimization**: Efficient job processing
- **Resource Limits**: Per-tenant resource management

### Horizontal Scaling
- **Worker Scaling**: Multiple worker instances
- **App Scaling**: Multiple app instances behind load balancer
- **Database Scaling**: Read replicas and connection pooling
- **Redis Scaling**: Redis Cluster for high availability

### Resource Management
- **Memory Limits**: Per-tenant memory usage tracking
- **CPU Limits**: CPU usage monitoring and limits
- **Storage Limits**: File storage quotas
- **Network Limits**: Bandwidth and request rate limits

## 🔧 Development

### Local Development
```bash
# Start development environment
npm run dev

# Start queue workers
npm run start:workers

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database Migrations
```bash
# Create new migration
npm run migrate:create migration-name

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down
```

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📚 API Documentation

Complete API documentation is available in `docs/API.md`:

- **Authentication**: JWT-based authentication
- **Rate Limiting**: Per-tenant rate limits
- **Endpoints**: RESTful API endpoints
- **Webhooks**: Event-driven notifications
- **SDKs**: JavaScript/TypeScript and Python SDKs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Testing**: Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **API Reference**: [docs/API.md](docs/API.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Multi-tenant architecture
- ✅ Queue system with BullMQ
- ✅ Rate limiting and resource management
- ✅ Basic monitoring and analytics

### Phase 2 (Next)
- 🔄 Advanced analytics dashboard
- 🔄 Webhook system
- 🔄 API versioning
- 🔄 SDK development

### Phase 3 (Future)
- 📋 Machine learning insights
- 📋 Advanced reporting
- 📋 White-label solutions
- 📋 Enterprise features

---

Built with ❤️ for scalable web auditing
