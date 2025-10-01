# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Development
```bash
# Start development with hot reload
npm run dev

# Development with Docker + Neon Local (creates ephemeral database branches)
npm run dev:docker
# or manually:
sh scripts/dev.sh

# Database operations
npm run db:generate    # Generate Drizzle migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Open Drizzle Studio
```

### Production
```bash
# Production Docker deployment
npm run prod:docker
# or manually:
sh scripts/prod.sh
```

### Code Quality
```bash
# Linting
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues

# Formatting
npm run format         # Format code with Prettier
npm run format:check   # Check formatting
```

### Docker Development Workflows
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f neon-local

# Execute commands in containers
docker-compose -f docker-compose.dev.yml exec app /bin/sh
docker-compose -f docker-compose.dev.yml exec neon-local psql -U neon -d neondb

# Reset development environment (creates fresh database branch)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## Architecture Overview

This is a Node.js Express API with a layered architecture:

### Tech Stack
- **Runtime**: Node.js with ES Modules (`"type": "module"`)
- **Framework**: Express.js with modern middleware stack
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Security**: Arcjet (rate limiting, bot detection, shields), Helmet, CORS
- **Validation**: Zod schemas
- **Authentication**: JWT with bcrypt for password hashing
- **Logging**: Winston with structured logging
- **Development**: Docker with Neon Local for ephemeral database branches

### Directory Structure & Import Aliases
The project uses Node.js imports mapping for clean imports:
- `#src/*` → `./src/*`
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

### Layered Architecture
1. **Routes** (`src/routes/`) - Express route definitions
2. **Controllers** (`src/controllers/`) - Request handling and response formatting
3. **Services** (`src/services/`) - Business logic layer
4. **Models** (`src/models/`) - Drizzle ORM schema definitions
5. **Validations** (`src/validations/`) - Zod validation schemas
6. **Middleware** (`src/middleware/`) - Custom Express middleware
7. **Utils** (`src/utils/`) - Utility functions (JWT, cookies, formatting)
8. **Config** (`src/config/`) - Configuration modules (database, logger, Arcjet)

### Security Architecture
- **Arcjet Security Middleware**: Applied globally with role-based rate limiting
  - Guest: 5 requests/minute
  - User: 10 requests/minute  
  - Admin: 20 requests/minute
- **Bot Detection**: Allows search engines and preview bots, blocks others
- **Shield Protection**: SQL injection and attack prevention
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing control

### Database Architecture
- **Development**: Neon Local proxy creates ephemeral branches automatically
- **Production**: Direct connection to Neon Cloud
- **ORM**: Drizzle with PostgreSQL dialect
- **Migrations**: Stored in `/drizzle` directory, managed via `drizzle-kit`

### Environment-Specific Behavior
The application adapts based on `NODE_ENV`:
- **Development**: Neon Local proxy configuration, console logging, verbose errors
- **Production**: Direct Neon Cloud connection, file logging only, minimal error exposure

### Configuration Files
- `drizzle.config.js` - Database schema and migration configuration
- `eslint.config.js` - ESLint rules with ES2022 modules, 2-space indent, single quotes
- `.prettierrc` - Code formatting rules
- `docker-compose.dev.yml` - Development environment with Neon Local
- `docker-compose.prod.yml` - Production environment
- Multi-stage `Dockerfile` with development and production targets

### API Endpoints
- `GET /` - Basic API greeting
- `GET /health` - Health check with uptime
- `GET /api` - API status endpoint
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User authentication
- `POST /api/auth/sign-out` - User logout
- `/api/users/*` - User management endpoints

### Logging Strategy
Winston logger with:
- **Development**: Console output with colors + file logging
- **Production**: File logging only (`logs/error.lg`, `logs/combined.log`)
- **Structured**: JSON format with timestamps and error stacks
- **HTTP Logging**: Morgan integration for request logging

### Environment Variables
Key variables that affect application behavior:
- `NODE_ENV` - Switches between development/production configurations
- `DATABASE_URL` - Database connection (auto-configured in dev via Neon Local)
- `ARCJET_KEY` - Required for security middleware
- `JWT_SECRET` - JWT token signing
- `LOG_LEVEL` - Winston log verbosity
- `CORS_ORIGIN` - CORS allowed origins

### Development Workflow
1. Use `npm run dev:docker` for full-stack development with fresh database branches
2. Database schema changes: `npm run db:generate` → `npm run db:migrate`
3. Code changes trigger automatic reloads in development container
4. Security middleware runs in LIVE mode even in development
5. Logs are mounted to host `./logs` directory for persistence