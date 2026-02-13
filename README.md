# TeamUp Backend - Microservices Architecture

A scalable microservices backend for TeamUp collaboration platform.

## 🏗️ Architecture

- **Workspace Service** (3002) - Workspaces, Channels, Groups, Members
- **Messaging Service** (3003) - Messages, DMs, Reactions
- **Task Service** (3004) - Tasks, Spaces, Comments
- **Meeting Service** (3005) - Meetings, Livekit integration
- **File Service** (3006) - File uploads, storage
- **Notification Service** (3007) - Push notifications
- **WebSocket Hub** (4000) - Real-time communication

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL (Aiven Cloud)
- Redis (Upstash)

### Setup

1. **Clone and install:**
   ```bash
   npm install
   npm run install:all
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Aiven and Upstash credentials
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Start services:**
   ```bash
   npm run dev:all
   ```

## 📦 Services

### Workspace Service (Port 3002)
```bash
npm run dev:workspace
```

### WebSocket Hub (Port 4000)
```bash
npm run dev:websocket
```

## 🛠️ Development

- `npm run install:all` - Install all dependencies
- `npm run dev:all` - Start all services
- `npm run build:all` - Build all services
- `npm run db:migrate` - Run database migrations
- `npm run clean` - Clean all node_modules

## 📚 Documentation

See individual service READMEs for detailed documentation.
