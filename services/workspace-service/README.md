# Workspace Service

Manages workspaces, channels, groups, and members for TeamUp.

## Features

- ✅ Workspace CRUD operations
- ✅ Channel management (public/private)
- ✅ Group management within channels
- ✅ Member management with roles
- ✅ PostgreSQL database (Aiven)
- ✅ Redis event publishing

## API Endpoints

### Workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces` - List workspaces (optional: ?userId=xxx)
- `GET /workspaces/:id` - Get workspace details
- `PATCH /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace

### Channels
- `POST /channels` - Create channel
- `GET /channels/workspace/:workspaceId` - List channels
- `GET /channels/:id` - Get channel details
- `PATCH /channels/:id` - Update channel
- `DELETE /channels/:id` - Delete channel
- `POST /channels/:channelId/members` - Add member
- `DELETE /channels/:channelId/members/:userId` - Remove member

### Groups
- `POST /groups` - Create group
- `GET /groups/channel/:channelId` - List groups
- `GET /groups/:id` - Get group details
- `PATCH /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:groupId/members` - Add member
- `DELETE /groups/:groupId/members/:userId` - Remove member

### Members
- `POST /workspaces/:workspaceId/members` - Add member
- `GET /workspaces/:workspaceId/members` - List members
- `PATCH /workspaces/:workspaceId/members/:userId` - Update role
- `DELETE /workspaces/:workspaceId/members/:userId` - Remove member

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   # .env file should have:
   DATABASE_URL=<your-aiven-workspace-db-url>
   REDIS_URL=<your-upstash-redis-url>
   PORT=3002
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. Start service:
   ```bash
   npm run start:dev
   ```

## Database Schema

- **Workspace** - Main workspace entity
- **WorkspaceMember** - Workspace membership with roles
- **Channel** - Communication channels (public/private)
- **ChannelMember** - Channel membership
- **Group** - Sub-groups within channels
- **GroupMember** - Group membership
