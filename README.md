# TeamUp Backend - Microservices Architecture

A scalable microservices backend for TeamUp collaboration platform built with NestJS, Prisma, PostgreSQL, and Redis.

---

## 📋 Contributor Guidelines

> **Important:** If you're contributing with LLM assistance, please specify these conventions in your prompt context.

### **Code Conventions**

- Use **kebab-case** for general files (`user-service.ts`, `auth-utils.ts`)
- Use **PascalCase** for classes and NestJS components (`UserController`, `AuthService`)
- Use **camelCase** for variables, functions, methods (`getUserById`, `workspaceData`)
- Use **SCREAMING_SNAKE_CASE** for constants and configs (`DATABASE_URL`, `MAX_RETRY_ATTEMPTS`)
- **Avoid magic strings and numbers** — use named constants
- Use **import aliases** wherever possible (configure in `tsconfig.json`)
- **Don't unnecessarily comment** — write self-documenting code
- **Contributors take full responsibility** for their code (no blaming LLMs)
- Properly distinguish between **dependencies** and **devDependencies**

### **NestJS Best Practices**

- Follow the **Module → Controller → Service → Repository** pattern
- Use **DTOs** with `class-validator` for all API inputs
- Implement proper **error handling** with NestJS exception filters
- Use **Guards** for authentication/authorization
- Use **Interceptors** for logging and transformation
- Keep controllers thin — business logic belongs in services
- Use **Prisma** for database operations (no raw SQL unless necessary)

### **Database & Prisma**

- Always create migrations: `npx prisma migrate dev --name descriptive_name`
- Use meaningful migration names: `add_user_avatar`, `create_channels_table`
- Never modify existing migrations — create new ones
- Use Prisma relations properly (avoid N+1 queries with `include`)
- Use transactions for operations that modify multiple tables

### **API Design**

- Follow **RESTful** conventions:
  - `GET /resources` - List all
  - `GET /resources/:id` - Get one
  - `POST /resources` - Create
  - `PATCH /resources/:id` - Partial update
  - `DELETE /resources/:id` - Delete
- Use proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500)
- Return consistent error response format
- Use query parameters for filtering/pagination: `?userId=123&limit=10`

### **Git Workflow**

- **Always pull with rebase** before pushing:
  ```bash
  git pull --rebase origin main
  ```
- **One feature/fix per commit** — keep commits atomic
- Follow **Conventional Commits** format:
  ```
  feat: add user profile endpoint
  fix: resolve channel creation bug
  refactor: optimize workspace query
  docs: update API documentation
  chore: update dependencies
  ```
- **Branch naming conventions**:
  ```
  feature/add-user-authentication
  fix/channel-creation-error
  refactor/optimize-queries
  docs/update-readme
  ```
- Always resolve conflicts properly — don't force push to shared branches

### **Testing & Quality**

- Write **unit tests** for services (use Jest)
- Write **integration tests** for API endpoints
- Test error cases, not just happy paths
- Use **environment variables** for configuration (never hardcode)
- Run linter before committing: `npm run lint`
- Use **Prettier** for code formatting (auto-format on save)

### **Performance & Security**

- Use **pagination** for list endpoints (don't return 1000s of records)
- Implement **rate limiting** on public endpoints
- Use **indexes** on frequently queried database fields
- Never expose sensitive data in API responses (passwords, tokens, etc.)
- Validate and sanitize all user inputs
- Use **Redis** for caching frequently accessed data

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                        │
│                   (Future - Port TBD)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┬──────────────┐
       │               │               │              │
┌──────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐  ┌────▼─────────┐
│ Workspace  │  │ Messaging  │  │   Task   │  │   Meeting    │
│  Service   │  │  Service   │  │ Service  │  │   Service    │
│ (Port 3002)│  │ (Port 3003)│  │(Port 3004│  │ (Port 3005)  │
└──────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬─────────┘
       │              │              │              │
       └──────────────┼──────────────┼──────────────┘
                      │              │
              ┌───────▼──────────────▼────────┐
              │     WebSocket Hub (Port 4000) │
              │    Real-time Communication     │
              └───────┬──────────────┬─────────┘
                      │              │
              ┌───────▼──────┐  ┌───▼──────────┐
              │  PostgreSQL  │  │    Redis     │
              │    (Aiven)   │  │  (Upstash)   │
              └──────────────┘  └──────────────┘
```

### **Services**

| Service | Port | Description | Database |
|---------|------|-------------|----------|
| **Workspace Service** | 3002 | Workspaces, Channels, Groups, Members | `teamup-workspace` |
| **Messaging Service** | 3003 | Messages, DMs, Reactions | `teamup-message` |
| **Task Service** | 3004 | Tasks, Spaces, Comments | `teamup-task` |
| **Meeting Service** | 3005 | Meetings, LiveKit integration | `teamup-meeting` |
| **File Service** | 3006 | File uploads, storage | `teamup-file` |
| **Notification Service** | 3007 | Push notifications | `teamup-notif` |
| **WebSocket Hub** | 4000 | Real-time events, presence | Redis |

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** (Aiven Cloud)
- **Redis** (Upstash)
- **Git**

### **1. Clone & Install**

```bash
# Clone repository
git clone https://github.com/Project-Management-System-PlanX/backend.git
cd backend

# Install dependencies
npm install
npm run install:all
```

### **2. Environment Setup**

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

**Required environment variables:**

```env
# Aiven PostgreSQL
DATABASE_URL=postgres://avnadmin:PASSWORD@HOST:PORT/teamup-workspace?sslmode=require

# Upstash Redis
REDIS_URL=redis://default:PASSWORD@HOST:PORT

# Application
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-this
PORT=3002
```

### **3. Database Setup**

**Important:** Whitelist your IP in Aiven Console first!

```bash
# Get your public IP
curl ifconfig.me

# Add this IP to Aiven Console:
# Console → teamup-workspace → Allowed IP Addresses → Add your IP/32
```

Then run migrations:

```bash
# Run database migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### **4. Start Services**

```bash
# Start workspace service only
npm run dev:workspace

# Start WebSocket hub only
npm run dev:websocket

# Start all services (requires all to be implemented)
npm run dev:all
```

---

## 📦 Project Structure

```
backend/
├── services/
│   ├── workspace-service/     # Workspaces, Channels, Groups
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   └── migrations/    # SQL migrations
│   │   └── src/
│   │       ├── workspaces/    # Workspace module
│   │       ├── channels/      # Channel module
│   │       ├── groups/        # Group module
│   │       ├── members/       # Member module
│   │       ├── app.module.ts  # Root module
│   │       └── main.ts        # Entry point
│   │
│   ├── websocket-hub/         # Real-time communication
│   │   └── src/
│   │       ├── gateway/       # WebSocket gateway
│   │       └── redis/         # Redis integration
│   │
│   └── [future-services]/     # Messaging, Task, Meeting, etc.
│
├── shared/                     # Shared utilities
│   ├── prisma-client/         # Shared Prisma service
│   ├── redis-client/          # Shared Redis service
│   ├── types/                 # Common TypeScript types
│   └── utils/                 # Helper functions
│
├── scripts/                    # Setup & deployment scripts
├── .env.example               # Environment template
├── package.json               # Root workspace config
└── tsconfig.json              # TypeScript config
```

---

## 🛠️ Development Commands

### **Installation**
```bash
npm install              # Install root dependencies
npm run install:all      # Install all workspace dependencies
```

### **Development**
```bash
npm run dev:workspace    # Start workspace service (3002)
npm run dev:websocket    # Start WebSocket hub (4000)
npm run dev:all          # Start all services
```

### **Database**
```bash
npm run db:migrate       # Run Prisma migrations
npm run db:generate      # Generate Prisma Client
npm run db:studio        # Open Prisma Studio (GUI)
```

### **Build**
```bash
npm run build:all        # Build all services
```

### **Linting & Formatting**
```bash
npm run lint             # Run Biome linter
npm run format           # Format code with Biome
npm run check            # Run all checks (lint + format)
```

### **Clean**
```bash
npm run clean            # Remove all node_modules and dist
```

---

## 🧪 API Testing

### **Workspace Service (Port 3002)**

```bash
# Health check
curl http://localhost:3002

# Create workspace
curl -X POST http://localhost:3002/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "user-123"
  }'

# List workspaces
curl http://localhost:3002/workspaces

# Get user's workspaces
curl http://localhost:3002/workspaces?userId=user-123

# Create channel
curl -X POST http://localhost:3002/channels \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-id",
    "name": "general",
    "type": "PUBLIC"
  }'

# List channels in workspace
curl http://localhost:3002/channels/workspace/workspace-id
```

### **Using Prisma Studio**

```bash
npm run db:studio
# Opens http://localhost:5555
# Visual interface to browse/edit database
```

### **Using psql (Direct Database Access)**

```bash
psql "postgres://avnadmin:PASSWORD@HOST:PORT/teamup-workspace?sslmode=require"

# Inside psql:
\dt                          # List tables
SELECT * FROM workspaces;    # Query data
\q                           # Quit
```

---

## 🔧 Troubleshooting

### **Can't connect to database**

```bash
# 1. Check if your IP is whitelisted in Aiven
curl ifconfig.me

# 2. Add your IP to Aiven Console:
#    Console → teamup-workspace → Allowed IP Addresses

# 3. Test connection
nc -zv HOST PORT
```

### **Prisma errors**

```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (⚠️ deletes all data)
cd services/workspace-service
npx prisma migrate reset
```

### **Port already in use**

```bash
# Find process using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>
```

---

## 📚 API Documentation

### **Workspace Service Endpoints**

**Workspaces:**
- `POST /workspaces` - Create workspace
- `GET /workspaces` - List all workspaces (optional `?userId=`)
- `GET /workspaces/:id` - Get workspace by ID
- `PATCH /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace

**Channels:**
- `POST /channels` - Create channel
- `GET /channels/workspace/:workspaceId` - Get channels in workspace
- `GET /channels/:id` - Get channel by ID
- `PATCH /channels/:id` - Update channel
- `DELETE /channels/:id` - Delete channel
- `POST /channels/:channelId/members` - Add member to channel
- `DELETE /channels/:channelId/members/:userId` - Remove member

**Groups:**
- `POST /groups` - Create group
- `GET /groups/channel/:channelId` - Get groups in channel
- `GET /groups/:id` - Get group by ID
- `PATCH /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:groupId/members` - Add member to group
- `DELETE /groups/:groupId/members/:userId` - Remove member

**Workspace Members:**
- `POST /workspaces/:workspaceId/members` - Add member
- `GET /workspaces/:workspaceId/members` - List members
- `PATCH /workspaces/:workspaceId/members/:userId` - Update member role
- `DELETE /workspaces/:workspaceId/members/:userId` - Remove member

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the conventions above
4. **Commit**: `git commit -m "feat: add amazing feature"`
5. **Pull with rebase**: `git pull --rebase origin main`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### **Pull Request Guidelines**

- Link related issues in the PR description
- Add screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Request review from at least one team member

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Project Lead:** [Your Name]
- **Backend Team:** [Team Members]
- **Frontend Team:** [Team Members]

---

## 🔗 Related Repositories

- **Frontend:** [teamup-frontend](https://github.com/Project-Management-System-PlanX/frontend)
- **Mobile:** [teamup-mobile](https://github.com/Project-Management-System-PlanX/mobile) *(coming soon)*

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Project-Management-System-PlanX/backend/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Project-Management-System-PlanX/backend/discussions)

---

**Happy Coding! 🚀**
