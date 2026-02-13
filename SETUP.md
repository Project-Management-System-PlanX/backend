# TeamUp Backend - Phase 1 Setup Guide

## 🎯 What You Have Now

Phase 1 is complete! You now have:

- ✅ **Root workspace** with npm workspaces
- ✅ **Shared utilities** (Prisma, Redis, Types, Logger)
- ✅ **Workspace Service** (Port 3002) - Full CRUD for workspaces, channels, groups, members
- ✅ **WebSocket Hub** (Port 4000) - Real-time communication with Socket.io

## 📋 Prerequisites

Before starting, make sure you have:

1. **Node.js** >= 18
2. **Aiven PostgreSQL** database URLs
3. **Upstash Redis** URL

## 🚀 Quick Start

### Step 1: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Aiven PostgreSQL URLs
WORKSPACE_DATABASE_URL=postgresql://user:password@host:port/teamup-workspace-db?sslmode=require

# Redis (Upstash)
REDIS_URL=redis://default:password@host:port

# App Config
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

### Step 2: Install Dependencies

```bash
npm install
npm run install:all
```

This will install dependencies for:
- Root workspace
- Workspace Service
- WebSocket Hub

### Step 3: Setup Database

Run Prisma migrations for Workspace Service:

```bash
cd services/workspace-service
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

Or use the script:

```bash
./scripts/setup-databases.sh
```

### Step 4: Start Services

**Option A: Start all services together**
```bash
npm run dev:all
```

**Option B: Start services individually**

Terminal 1 - Workspace Service:
```bash
npm run dev:workspace
```

Terminal 2 - WebSocket Hub:
```bash
npm run dev:websocket
```

## ✅ Verification

### 1. Check Services are Running

You should see:
- ✅ Workspace Service on `http://localhost:3002`
- ✅ WebSocket Hub on `http://localhost:4000`

### 2. Test Workspace Service

Create a workspace:
```bash
curl -X POST http://localhost:3002/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workspace",
    "slug": "my-first-workspace",
    "ownerId": "user-123"
  }'
```

List workspaces:
```bash
curl http://localhost:3002/workspaces
```

### 3. Test WebSocket Hub

Create a simple HTML file to test WebSocket:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Test</h1>
  <div id="status">Connecting...</div>
  
  <script>
    const socket = io('http://localhost:4000');
    
    socket.on('connect', () => {
      document.getElementById('status').textContent = 'Connected!';
      
      // Authenticate
      socket.emit('authenticate', { userId: 'user-123' });
      
      // Join workspace
      socket.emit('join-workspace', { workspaceId: 'workspace-123' });
    });
    
    socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });
    
    socket.on('joined-workspace', (data) => {
      console.log('Joined workspace:', data);
    });
    
    socket.on('disconnect', () => {
      document.getElementById('status').textContent = 'Disconnected';
    });
  </script>
</body>
</html>
```

## 📚 API Documentation

### Workspace Service (Port 3002)

See [services/workspace-service/README.md](services/workspace-service/README.md) for complete API documentation.

**Key Endpoints:**
- `POST /workspaces` - Create workspace
- `GET /workspaces` - List workspaces
- `POST /channels` - Create channel
- `POST /groups` - Create group
- `POST /workspaces/:id/members` - Add member

### WebSocket Hub (Port 4000)

See [services/websocket-hub/README.md](services/websocket-hub/README.md) for complete WebSocket events.

**Key Events:**
- `authenticate` - Authenticate user
- `join-workspace` - Join workspace room
- `join-channel` - Join channel room
- `message:new` - Receive new messages
- `notification:new` - Receive notifications

## 🔧 Useful Commands

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev:all

# Start individual services
npm run dev:workspace
npm run dev:websocket

# Database operations
npm run db:migrate      # Run migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio

# Build all services
npm run build:all

# Clean all node_modules
npm run clean
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Check your `WORKSPACE_DATABASE_URL` in `.env`
2. Ensure SSL mode is enabled: `?sslmode=require`
3. Verify database exists in Aiven console

### Redis Connection Issues

1. Check your `REDIS_URL` in `.env`
2. Verify Upstash Redis is active
3. Check Redis connection in Upstash console

### Port Already in Use

If ports 3002 or 4000 are in use:

1. Change ports in service `.env` files
2. Update `PORT` variable
3. Restart services

## 🎉 Next Steps

Phase 1 is complete! You can now:

1. **Test the APIs** using Postman or Thunder Client
2. **Connect a frontend** to the services
3. **Move to Phase 2** - Implement Messaging and Task services

## 📖 Architecture Overview

```
Frontend (Next.js)
    ↓
    ├─→ Workspace Service (3002) ─→ PostgreSQL (Aiven)
    │                              ↓
    └─→ WebSocket Hub (4000) ←─── Redis (Upstash)
```

**Service Communication:**
- Services publish events to Redis
- WebSocket Hub subscribes to Redis events
- WebSocket Hub broadcasts to connected clients

## 🔐 Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` to a strong random value
2. Enable authentication middleware
3. Add rate limiting
4. Use environment-specific CORS origins
5. Enable HTTPS/WSS

## 💡 Tips

- Use Prisma Studio to view database: `npm run db:studio`
- Check service logs for debugging
- Use Redis CLI to monitor Pub/Sub events
- Keep services running in separate terminals for easier debugging

---

**Need Help?** Check the service-specific READMEs or review the implementation plan.
