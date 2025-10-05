# Whalli - Turborepo Monorepo

A modern project management platform with complete authentication, built with **Turborepo**, **Next.js 14**, **NestJS**, **Better-Auth**, and **Prisma**.

## 🏗️ Project Structure

```
whalli/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   ├── api/          # NestJS backend (port 3001)
│   └── admin/        # Next.js admin panel (port 3002)
├── packages/
│   ├── ui/           # Shared UI components (Radix UI + Tailwind)
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared configuration (ESLint, Prettier, TypeScript)
└── .github/
    └── workflows/    # CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd whalli

# Install dependencies
pnpm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Generate Prisma client
cd apps/api && pnpm prisma generate

# Run database migrations (requires PostgreSQL)
cd apps/api && pnpm prisma db push
```

### Development

```bash
# Start all applications in development mode
pnpm dev

# Or start individual applications
pnpm dev --filter=@whalli/web     # Web app (http://localhost:3000)
pnpm dev --filter=@whalli/api     # API server (http://localhost:3001)
pnpm dev --filter=@whalli/admin   # Admin panel (http://localhost:3002)
```

### Building

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build --filter=@whalli/web
```

## 📦 Applications

### Web App (`apps/web`)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: Better Auth
- **Features**: User dashboard, project management, task tracking

### API (`apps/api`)
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Features**: REST API, JWT validation, CRUD operations

### Admin Panel (`apps/admin`)
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: Better Auth (admin protected routes)
- **Features**: User management, system administration

## 📚 Packages

### UI Package (`packages/ui`)
- Shared React components styled with Tailwind CSS
- Built on Radix UI primitives
- Components: Button, Input, Modal, etc.

### Types Package (`packages/types`)
- Shared TypeScript interfaces and types
- Covers User, Project, Task, Message, Subscription, Model entities

### Config Package (`packages/config`)
- Shared ESLint, Prettier, and TypeScript configurations
- Consistent code style across all applications

## 🐳 Docker Support

Each application includes optimized multi-stage Dockerfiles:

```bash
# Build Docker images
docker build -f apps/web/Dockerfile -t whalli-web .
docker build -f apps/api/Dockerfile -t whalli-api .
docker build -f apps/admin/Dockerfile -t whalli-admin .
```

## 🚀 VPS Deployment

For production deployment on a VPS with Docker Compose:

```bash
# Copy environment template
cp .env.example .env

# Configure your domain and secrets
nano .env

# Deploy with automated SSL
chmod +x deploy.sh
./deploy.sh
```

**Services will be available at:**
- Web App: `https://web.yourdomain.com`
- API: `https://api.yourdomain.com`
- Admin Panel: `https://admin.yourdomain.com`
- Traefik Dashboard: `https://traefik.yourdomain.com`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## 🔧 Scripts

```bash
# Development
pnpm dev                 # Start all apps in dev mode
pnpm lint                # Lint all packages
pnpm type-check          # Type check all packages
pnpm test                # Run tests

# Production
pnpm build               # Build all applications
pnpm format              # Format code with Prettier
pnpm clean               # Clean build artifacts
```

## 🌍 Environment Variables

### Web App (`.env.local`)
```env
DATABASE_URL="postgresql://..."
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
NEXTAUTH_SECRET="your_secret_key"
```

### API (`.env`)
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret"
FRONTEND_URL="http://localhost:3000"
```

## 🚀 Deployment

The project includes GitHub Actions for automated CI/CD:

1. **Lint & Test**: Runs ESLint, TypeScript checks, and tests
2. **Build**: Builds all applications
3. **Docker**: Builds and pushes Docker images to GitHub Container Registry

## 🛠️ Technology Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS, Radix UI
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For questions and support, please open an issue in the GitHub repository.