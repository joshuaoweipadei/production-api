# Production API - Docker Setup Guide

This guide explains how to run the Production API using Docker with Neon Database for both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2
- Neon account with a project created
- Basic understanding of Docker and environment variables

### Required Neon Credentials

You'll need the following from your [Neon Dashboard](https://console.neon.tech):

1. **NEON_API_KEY**: Your API key (found in Account Settings > API Keys)
2. **NEON_PROJECT_ID**: Your project ID (from the project URL or dashboard)
3. **PARENT_BRANCH_ID**: The branch ID to use as parent for ephemeral branches (usually `main`)
4. **DATABASE_URL**: Your production database connection string (for production only)

## Development Environment

### Overview

The development environment uses **Neon Local** - a Docker proxy that creates ephemeral database branches automatically. Each time you start the development environment, you get a fresh copy of your database.

### Setup

1. **Copy and configure the development environment file:**

   ```bash
   cp .env.development .env.development.local
   ```

2. **Edit `.env.development.local` with your Neon credentials:**

   ```bash
   # Required Neon credentials
   NEON_API_KEY=neon_api_xxxxxxxxxxxxx
   NEON_PROJECT_ID=proud-lab-12345678
   PARENT_BRANCH_ID=br_main_branch_id_here

   # Optional: Customize other settings
   JWT_SECRET=your_dev_jwt_secret_here
   CORS_ORIGIN=http://localhost:3001
   ```

3. **Start the development environment:**

   ```bash
   # Load environment variables and start services
   export $(cat .env.development.local | xargs) && docker-compose -f docker-compose.dev.yml up --build

   # Or run in detached mode
   export $(cat .env.development.local | xargs) && docker-compose -f docker-compose.dev.yml up -d --build
   ```

4. **The application will be available at:**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Direct database access: localhost:5432 (if needed for debugging)

### Development Features

- **Hot Reloading**: Source code changes are automatically detected and the server restarts
- **Fresh Database**: Each container restart creates a new ephemeral database branch
- **Debug Logging**: Detailed logs for development debugging
- **Volume Mounting**: Code changes don't require container rebuild

### Stopping Development Environment

```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start next time)
docker-compose -f docker-compose.dev.yml down -v

# Stop and remove everything including images
docker-compose -f docker-compose.dev.yml down --rmi all -v
```

## Production Environment

### Overview

The production environment connects directly to your Neon Cloud database without using Neon Local.

### Setup

1. **Create production environment file:**

   ```bash
   cp .env.production .env.production.local
   ```

2. **Edit `.env.production.local` with production values:**

   ```bash
   # CRITICAL: Use strong secrets in production
   NODE_ENV=production
   DATABASE_URL=postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/database_name?sslmode=require
   JWT_SECRET=your_super_strong_production_jwt_secret_min_32_characters
   CORS_ORIGIN=https://your-frontend-domain.com
   LOG_LEVEL=info
   ```

3. **Deploy to production:**

   ```bash
   # Load environment variables and start production services
   export $(cat .env.production.local | xargs) && docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify deployment:**

   ```bash
   # Check service status
   docker-compose -f docker-compose.prod.yml ps

   # View logs
   docker-compose -f docker-compose.prod.yml logs -f app

   # Test health endpoint
   curl http://localhost:3000/health
   ```

### Production Features

- **Optimized Build**: Multi-stage Docker build for minimal image size
- **Security**: Non-root user, resource limits, health checks
- **Monitoring**: Health checks and structured logging
- **Scalability**: Ready for load balancers and orchestration platforms
- **Persistence**: Logs are persisted in Docker volumes

### Production Deployment Options

#### Option 1: Single Server Deployment

```bash
# Direct deployment on a VPS or dedicated server
export $(cat .env.production.local | xargs) && docker-compose -f docker-compose.prod.yml up -d --build
```

#### Option 2: With Reverse Proxy (Nginx)

Uncomment the nginx service in `docker-compose.prod.yml` and add SSL certificates.

#### Option 3: Container Orchestration

Use the Dockerfile with Kubernetes, Docker Swarm, or cloud container services.

## Database Migrations

### Development Migrations

```bash
# Generate migration files
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Production Migrations

```bash
# Apply migrations in production
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

**Important**: Always test migrations in development first!

## Environment Variables Reference

| Variable           | Development            | Production               | Description                          |
| ------------------ | ---------------------- | ------------------------ | ------------------------------------ |
| `NODE_ENV`         | development            | production               | Application environment              |
| `DATABASE_URL`     | Auto-set by Neon Local | Manual Neon Cloud URL    | Database connection string           |
| `NEON_API_KEY`     | Required               | Not needed               | Neon API key for Local proxy         |
| `NEON_PROJECT_ID`  | Required               | Not needed               | Your Neon project ID                 |
| `PARENT_BRANCH_ID` | Required               | Not needed               | Parent branch for ephemeral branches |
| `JWT_SECRET`       | Dev secret             | Strong production secret | JWT signing secret                   |
| `CORS_ORIGIN`      | localhost:3001         | Your domain              | CORS allowed origin                  |
| `LOG_LEVEL`        | debug                  | info                     | Logging verbosity                    |

## Troubleshooting

### Common Issues

#### 1. Neon Local Connection Failed

```bash
# Check if Neon Local is healthy
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify credentials in .env.development.local
# Make sure NEON_API_KEY, NEON_PROJECT_ID, and PARENT_BRANCH_ID are correct
```

#### 2. Permission Denied Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

#### 3. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process or change the port in environment variables
```

#### 4. Database Migration Errors

```bash
# Reset development database (creates new ephemeral branch)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# For production, check your DATABASE_URL and network connectivity
```

#### 5. Container Build Failures

```bash
# Clean Docker cache and rebuild
docker system prune -a
docker-compose -f docker-compose.dev.yml build --no-cache --pull
```

### Useful Commands

```bash
# View all containers
docker ps -a

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f neon-local

# Execute commands inside container
docker-compose -f docker-compose.dev.yml exec app /bin/sh

# Monitor resource usage
docker stats

# Clean up unused Docker resources
docker system prune
```

## Architecture Overview

### Development Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Developer     │    │   Docker Host    │    │  Neon Cloud     │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │  ┌─────────────┐ │    │  ┌───────────┐  │
│  │    IDE    │  │◄──►│  │     App     │ │    │  │ Main Branch │  │
│  └───────────┘  │    │  │ Container   │ │    │  │             │  │
│                 │    │  └─────────────┘ │    │  └───────────┘  │
│                 │    │         │        │    │         │       │
│                 │    │         ▼        │    │         ▼       │
│                 │    │  ┌─────────────┐ │    │  ┌───────────┐  │
│                 │    │  │ Neon Local  │◄┼────┼─►│ Ephemeral │  │
│                 │    │  │   Proxy     │ │    │  │  Branch   │  │
│                 │    │  └─────────────┘ │    │  └───────────┘  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Production Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Internet     │    │  Production      │    │  Neon Cloud     │
│                 │    │  Server          │    │                 │
│  ┌───────────┐  │    │  ┌─────────────┐ │    │  ┌───────────┐  │
│  │   Users   │  │◄──►│  │     App     │ │◄──►│  │Production │  │
│  └───────────┘  │    │  │ Container   │ │    │  │ Database  │  │
│                 │    │  └─────────────┘ │    │  └───────────┘  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Differences

| Aspect           | Development                       | Production                   |
| ---------------- | --------------------------------- | ---------------------------- |
| Database         | Ephemeral branches via Neon Local | Direct Neon Cloud connection |
| Data Persistence | Temporary (reset on restart)      | Permanent                    |
| Performance      | Development optimized             | Production optimized         |
| Logs             | Verbose debugging                 | Structured info/error logs   |
| Security         | Relaxed for development           | Hardened for production      |
| Scaling          | Single instance                   | Ready for horizontal scaling |

## Security Considerations

### Development

- Use different JWT secrets than production
- Keep Neon credentials in `.env.development.local` (gitignored)
- Network isolation via Docker networks

### Production

- Use strong, unique JWT secrets (minimum 32 characters)
- Never commit production secrets to version control
- Use secrets management systems for sensitive data
- Enable SSL/TLS in production
- Regularly rotate API keys and passwords
- Monitor for security vulnerabilities

## Next Steps

1. **Set up CI/CD**: Integrate with GitHub Actions, GitLab CI, or similar
2. **Monitoring**: Add application monitoring (e.g., Prometheus, DataDog)
3. **Logging**: Centralize logs with ELK stack or similar
4. **Backup**: Implement backup strategies for production data
5. **SSL/HTTPS**: Configure SSL certificates for production domains
6. **Load Balancing**: Set up load balancers for high availability

For additional help, refer to:

- [Neon Documentation](https://neon.tech/docs)
- [Docker Documentation](https://docs.docker.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
