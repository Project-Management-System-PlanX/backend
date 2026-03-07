# 🛠️ Installation & Setup Guide (Backend)

This document provides a comprehensive guide to installing dependencies and running the backend microservices safely.

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Supabase Account** (for PostgreSQL and Auth)
- **Redis** (optional, for caching)

---

## 🚀 Step 1: Clean Installation

If you are experiencing dependency issues or "module not found" errors, run the following commands from the root of the backend directory:

```bash
# 1. Remove all existing dependencies and build artifacts
npm run clean

# 2. Install root dependencies AND all workspace dependencies
npm run install:all
```

> [!IMPORTANT]
> Always use `npm run install:all`. In a microservices architecture, running a plain `npm install` in the root may miss dependencies within `services/` and `shared/` directories.

---

## 🗄️ Step 2: Database Initialization

Each service that uses a database requires its own Prisma client generation.

```bash
# Generate Prisma clients for all services
npm run db:generate

# Or for a specific service (e.g., meeting-service)
cd services/meeting-service && npx prisma generate
```

---

## 📄 Step 3: Environment Configuration

Ensure your `.env` file exists in the root directory. Copy the template first:

```bash
cp .env.example .env
```

### Essential Variables:
- `DATABASE_URL`: Must be the Supabase connection string. 
  - Use **Session Pooler (Port 5432)** for migrations.
  - Use **Transaction Pooler (Port 6543)** for the running application.
- `MEETING_PORT`: Default is `3005`.
- `PORT`: Default for Workspace service is `3002`.

---

## 🏃 Step 4: Running Safely

### Checking for Port Conflicts
Before starting, ensure no other processes are occupying the required ports:

```bash
# Check ports 3002, 3005, and 4000
lsof -i :3002,3005,4000
```
If a process is found, kill it with `kill -9 <PID>`.

### Starting the Services
```bash
# Recommended: Start all active services together
npm run dev:all
```

---

## 🔧 Common Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Prisma Error: Client not found** | Run `npm run db:generate` to sync the Prisma client with the schema. |
| **Bcrypt/Native Module Issues** | Run `npm run clean && npm run install:all` to recompile native modules for your OS. |
| **Port Already in Use** | Search for the process using `lsof -i :<port>` and terminate it. |
| **Service Not Starting** | Check `.env` for missing Supabase keys. |
