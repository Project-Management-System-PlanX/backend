# Workspace Service - Quick Reference

## 🎯 Key Differences: Supabase vs Prisma + Aiven

| Aspect | Supabase | Prisma + Aiven |
|--------|----------|----------------|
| **Schema Definition** | UI (Table Editor) | Code (`schema.prisma`) |
| **Table Creation** | Manual in UI | Automatic via `prisma migrate` |
| **Database Access** | Supabase Client | Prisma Client |
| **Migrations** | SQL Editor | Prisma CLI |
| **Type Safety** | Manual types | Auto-generated types |

---

## 📍 Where is the Schema?

**Location:**
```
/home/thiru/planX/backend/services/workspace-service/prisma/schema.prisma
```

**What it contains:**
```prisma
model Workspace {
  id       String   @id @default(uuid())
  name     String
  slug     String   @unique
  ownerId  String
  
  members  WorkspaceMember[]
  channels Channel[]
}

model Channel {
  id          String  @id @default(uuid())
  workspaceId String
  name        String
  type        String  @default("PUBLIC")
  
  workspace   Workspace @relation(...)
  members     ChannelMember[]
  groups      Group[]
}

// + WorkspaceMember, ChannelMember, Group, GroupMember
```

---

## 🚀 Quick Start (3 Steps)

### 1. Configure Database URL

Edit `/home/thiru/planX/backend/services/workspace-service/.env`:

```env
DATABASE_URL=postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
```

Get this from Aiven → Click `teamup-workspace` → Copy "Service URI"

### 2. Create Tables

```bash
cd /home/thiru/planX/backend/services/workspace-service
npx prisma migrate dev --name init
```

This creates all tables in your Aiven database.

### 3. Start Service

```bash
# Build
cd /home/thiru/planX/backend
npx prisma generate --schema=./services/workspace-service/prisma/schema.prisma
cd services/workspace-service
npx tsc --build --force

# Start
node dist/main.js
```

---

## 🧪 Test Endpoints

### Create Workspace
```bash
curl -X POST http://localhost:3002/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"My Workspace","slug":"my-workspace","ownerId":"user-123"}'
```

### List Workspaces
```bash
curl http://localhost:3002/workspaces
```

### Create Channel
```bash
curl -X POST http://localhost:3002/channels \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"WORKSPACE_ID","name":"general","type":"PUBLIC"}'
```

---

## 📊 Architecture Flow

```
1. You define schema in code (schema.prisma)
   ↓
2. Run prisma migrate → Creates tables in Aiven
   ↓
3. Prisma generates TypeScript client
   ↓
4. Your service uses Prisma Client to query database
   ↓
5. Frontend calls your REST API
```

---

## 🔧 Useful Commands

```bash
# View database in browser
npx prisma studio

# See what tables will be created
npx prisma migrate dev --create-only

# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Check connection
npx prisma db pull
```

---

## 📝 Environment Variables

**Root `.env`** (`/home/thiru/planX/backend/.env`):
```env
WORKSPACE_DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

**Service `.env`** (`/home/thiru/planX/backend/services/workspace-service/.env`):
```env
DATABASE_URL=${WORKSPACE_DATABASE_URL}
REDIS_URL=${REDIS_URL}
PORT=3002
```

The service reads from root environment variables.
