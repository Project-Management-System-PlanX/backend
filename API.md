# TeamUp Workspace Service API Documentation

**Base URL:** `http://localhost:3002` (development) or your Render URL (production)

**Authentication:** All endpoints (except `GET /`) require a Supabase access token:
```
Authorization: Bearer <supabase_access_token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Workspaces](#workspaces)
4. [Workspace Members](#workspace-members)
5. [Channels](#channels)
6. [Groups](#groups)
7. [Error Responses](#error-responses)

---

## 🔐 Authentication

All API requests (except `GET /`) must include a valid Supabase access token in the `Authorization` header.

**How to get a token:**
1. Sign in via Supabase Auth (email/password, Google OAuth, etc.)
2. Get the session: `supabase.auth.getSession()`
3. Use `session.access_token` as the Bearer token

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." http://localhost:3002/workspaces
```

**What happens on each request:**
1. The guard extracts and validates the Bearer token via `supabase.auth.getUser(token)`
2. The user profile is automatically synced to the database (upsert by `supabaseId`)
3. The authenticated user's ID is available in controllers via `@CurrentUser('userId')`

---

## 🔓 Health Check

### `GET /`

Returns service health status. **No authentication required.**

**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "workspace-service"
}
```

---

## 👤 Users

### Get My Profile

**Endpoint:** `GET /users/me`

**Description:** Returns the authenticated user's profile from the database.

**Response:** `200 OK`
```json
{
  "id": "internal-uuid",
  "supabaseId": "supabase-auth-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "imageUrl": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-03-01T14:00:00.000Z",
  "updatedAt": "2026-03-01T14:00:00.000Z"
}
```

> **Note:** User profiles are auto-created on first authenticated request. No separate signup endpoint is needed.

**cURL Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/users/me
```

---

## 🏢 Workspaces

### Create Workspace

**Endpoint:** `POST /workspaces`

**Permission:** Any authenticated user

**Description:** Creates a new workspace. The authenticated user is automatically set as `ownerId` and added as a member with `OWNER` role.

**Request Body:**
```json
{
  "name": "My Team",
  "slug": "my-team",
  "avatar": "https://example.com/avatar.png"
}
```

**Validation:**
- `name` (required, string): Workspace name
- `slug` (required, string, unique): URL-friendly identifier
- `avatar` (optional, URL): Workspace avatar image

> **Note:** `ownerId` is injected from the authenticated user — never from the request body.

**Response:** `201 Created`
```json
{
  "id": "ws-uuid-123",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "supabase-user-uuid",
  "avatar": "https://example.com/avatar.png",
  "createdAt": "2026-03-01T14:00:00.000Z",
  "updatedAt": "2026-03-01T14:00:00.000Z"
}
```

**Errors:**
- `409 Conflict` — Workspace with this slug already exists
- `400 Bad Request` — Invalid input data

**cURL Example:**
```bash
curl -X POST http://localhost:3002/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "slug": "my-team"
  }'
```

---

### List My Workspaces

**Endpoint:** `GET /workspaces`

**Permission:** Any authenticated user

**Description:** Returns only workspaces where the authenticated user is a member.

**Response:** `200 OK`
```json
[
  {
    "id": "ws-uuid-123",
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "supabase-user-uuid",
    "avatar": "https://example.com/avatar.png",
    "createdAt": "2026-03-01T14:00:00.000Z",
    "updatedAt": "2026-03-01T14:00:00.000Z"
  }
]
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/workspaces
```

---

### Get Workspace

**Endpoint:** `GET /workspaces/:id`

**Permission:** Any authenticated user

**Description:** Get a single workspace with its members and channels.

**Response:** `200 OK`
```json
{
  "id": "ws-uuid-123",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "supabase-user-uuid",
  "avatar": null,
  "createdAt": "2026-03-01T14:00:00.000Z",
  "updatedAt": "2026-03-01T14:00:00.000Z",
  "members": [
    {
      "id": "member-uuid-1",
      "workspaceId": "ws-uuid-123",
      "userId": "supabase-user-uuid",
      "role": "OWNER",
      "joinedAt": "2026-03-01T14:00:00.000Z"
    }
  ],
  "channels": [
    {
      "id": "channel-uuid-1",
      "workspaceId": "ws-uuid-123",
      "name": "general",
      "type": "PUBLIC",
      "description": "General discussion",
      "createdAt": "2026-03-01T14:05:00.000Z",
      "updatedAt": "2026-03-01T14:05:00.000Z"
    }
  ]
}
```

**Errors:**
- `404 Not Found` — Workspace not found

---

### Update Workspace

**Endpoint:** `PATCH /workspaces/:id`

**Permission:** Workspace `OWNER` or `ADMIN` only

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "avatar": "https://example.com/new-avatar.png"
}
```

**Validation:**
- `name` (optional, string): New workspace name
- `avatar` (optional, URL): New avatar URL
- Cannot update `slug` or `ownerId`

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Workspace not found

---

### Delete Workspace

**Endpoint:** `DELETE /workspaces/:id`

**Permission:** Workspace `OWNER` only

**Description:** Deletes the workspace and all related data (members, channels, groups) via cascade.

**Errors:**
- `403 Forbidden` — Only the workspace owner can delete it
- `404 Not Found` — Workspace not found

---

## 👥 Workspace Members

### Add Member

**Endpoint:** `POST /workspaces/:workspaceId/members`

**Permission:** Any authenticated user

**Request Body:**
```json
{
  "userId": "supabase-user-uuid",
  "role": "MEMBER"
}
```

**Roles:** `OWNER`, `ADMIN`, `MEMBER` (default)

---

### List Members

**Endpoint:** `GET /workspaces/:workspaceId/members`

**Permission:** Any authenticated user

**Response:** `200 OK`
```json
[
  {
    "id": "member-uuid",
    "workspaceId": "ws-uuid-123",
    "userId": "supabase-user-uuid",
    "role": "OWNER",
    "joinedAt": "2026-03-01T14:00:00.000Z"
  }
]
```

---

### Update Member Role

**Endpoint:** `PATCH /workspaces/:workspaceId/members/:userId`

**Permission:** Workspace `OWNER` or `ADMIN` only

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Member not found

---

### Remove Member

**Endpoint:** `DELETE /workspaces/:workspaceId/members/:userId`

**Permission:**
- Members can remove **themselves** (leave workspace)
- `OWNER` or `ADMIN` can remove **anyone**

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Requester is not a workspace member

---

## 📢 Channels

### Create Channel

**Endpoint:** `POST /channels`

**Permission:** Must be a member of the workspace

**Description:** Creates a channel in a workspace. The creator is automatically added as a channel member with `ADMIN` role.

**Request Body:**
```json
{
  "workspaceId": "ws-uuid-123",
  "name": "general",
  "type": "PUBLIC",
  "description": "General discussion channel"
}
```

**Validation:**
- `workspaceId` (required, string): Parent workspace ID
- `name` (required, string): Channel name
- `type` (optional, enum): `"PUBLIC"` or `"PRIVATE"` (default: `"PUBLIC"`)
- `description` (optional, string): Channel description

**Errors:**
- `403 Forbidden` — You must be a workspace member to create a channel

---

### List Channels in Workspace

**Endpoint:** `GET /channels/workspace/:workspaceId`

**Permission:** Any authenticated user

**Response:** `200 OK`
```json
[
  {
    "id": "channel-uuid-1",
    "workspaceId": "ws-uuid-123",
    "name": "general",
    "type": "PUBLIC",
    "description": "General discussion",
    "createdAt": "2026-03-01T14:05:00.000Z",
    "updatedAt": "2026-03-01T14:05:00.000Z",
    "members": [...],
    "groups": [...]
  }
]
```

---

### Get Channel

**Endpoint:** `GET /channels/:id`

**Permission:** Any authenticated user

**Response includes:** Channel details with `members` and `groups` arrays.

**Errors:**
- `404 Not Found` — Channel not found

---

### Update Channel

**Endpoint:** `PATCH /channels/:id`

**Permission:** Channel `ADMIN`, Workspace `OWNER`, or Workspace `ADMIN`

**Request Body:**
```json
{
  "name": "updated-general",
  "type": "PRIVATE",
  "description": "Updated description"
}
```

**Errors:**
- `403 Forbidden` — Insufficient permissions to modify this channel
- `404 Not Found` — Channel not found

---

### Delete Channel

**Endpoint:** `DELETE /channels/:id`

**Permission:** Channel `ADMIN`, Workspace `OWNER`, or Workspace `ADMIN`

**Description:** Deletes the channel and all related data (members, groups, group members) via cascade.

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Channel not found

---

### Add Member to Channel

**Endpoint:** `POST /channels/:channelId/members`

**Permission:** Any authenticated user

**Request Body:**
```json
{
  "userId": "supabase-user-uuid",
  "role": "MEMBER"
}
```

---

### Remove Member from Channel

**Endpoint:** `DELETE /channels/:channelId/members/:userId`

**Permission:** Any authenticated user

---

## 🔖 Groups

### Create Group

**Endpoint:** `POST /groups`

**Permission:** Must be a member of the parent channel

**Description:** Creates a group within a channel. The creator is automatically added as a group member.

**Request Body:**
```json
{
  "channelId": "channel-uuid-1",
  "name": "Developers",
  "description": "Development team"
}
```

**Errors:**
- `403 Forbidden` — You must be a channel member to create a group
- `404 Not Found` — Channel not found

---

### List Groups in Channel

**Endpoint:** `GET /groups/channel/:channelId`

**Permission:** Any authenticated user

**Response:** `200 OK`
```json
[
  {
    "id": "group-uuid-1",
    "channelId": "channel-uuid-1",
    "name": "Developers",
    "description": "Development team",
    "createdAt": "2026-03-01T14:10:00.000Z",
    "updatedAt": "2026-03-01T14:10:00.000Z",
    "members": [
      {
        "id": "gm-uuid-1",
        "groupId": "group-uuid-1",
        "userId": "supabase-user-uuid",
        "joinedAt": "2026-03-01T14:10:00.000Z"
      }
    ]
  }
]
```

---

### Get Group

**Endpoint:** `GET /groups/:id`

**Permission:** Any authenticated user

**Errors:**
- `404 Not Found` — Group not found

---

### Update Group

**Endpoint:** `PATCH /groups/:id`

**Permission:** Channel `ADMIN`, Workspace `OWNER`, or Workspace `ADMIN`

**Request Body:**
```json
{
  "name": "Senior Developers",
  "description": "Senior development team"
}
```

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Group not found

---

### Delete Group

**Endpoint:** `DELETE /groups/:id`

**Permission:** Channel `ADMIN`, Workspace `OWNER`, or Workspace `ADMIN`

**Errors:**
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Group not found

---

### Add Member to Group

**Endpoint:** `POST /groups/:groupId/members`

**Permission:** Any authenticated user

**Request Body:**
```json
{
  "userId": "supabase-user-uuid"
}
```

---

### Remove Member from Group

**Endpoint:** `DELETE /groups/:groupId/members/:userId`

**Permission:** Any authenticated user

---

## ❌ Error Responses

All errors follow this format:
```json
{
  "statusCode": 401,
  "message": "Missing or invalid Authorization header",
  "error": "Unauthorized"
}
```

| Status Code | Type | Description |
|-------------|------|-------------|
| `400` | Bad Request | Invalid input (validation failed) |
| `401` | Unauthorized | Missing, invalid, or expired auth token |
| `403` | Forbidden | Insufficient permissions (wrong role) |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (e.g. duplicate workspace slug) |

---

## 📊 Route Summary (42 endpoints)

```
GET    /                                              Health check (no auth)

GET    /users/me                                      My profile

POST   /workspaces                                    Create workspace
GET    /workspaces                                    List my workspaces
GET    /workspaces/:id                                Get workspace
PATCH  /workspaces/:id                                Update workspace (OWNER/ADMIN)
DELETE /workspaces/:id                                Delete workspace (OWNER)

POST   /workspaces/:workspaceId/members               Add member
GET    /workspaces/:workspaceId/members               List members
PATCH  /workspaces/:workspaceId/members/:userId       Update role (OWNER/ADMIN)
DELETE /workspaces/:workspaceId/members/:userId       Remove member (self/OWNER/ADMIN)

POST   /channels                                      Create channel (workspace member)
GET    /channels/workspace/:workspaceId               List channels
GET    /channels/:id                                  Get channel
PATCH  /channels/:id                                  Update (ch ADMIN / ws OWNER/ADMIN)
DELETE /channels/:id                                  Delete (ch ADMIN / ws OWNER/ADMIN)
POST   /channels/:channelId/members                   Add channel member
DELETE /channels/:channelId/members/:userId           Remove channel member

POST   /groups                                        Create group (channel member)
GET    /groups/channel/:channelId                     List groups
GET    /groups/:id                                    Get group
PATCH  /groups/:id                                    Update (ch ADMIN / ws OWNER/ADMIN)
DELETE /groups/:id                                    Delete (ch ADMIN / ws OWNER/ADMIN)
POST   /groups/:groupId/members                       Add group member
DELETE /groups/:groupId/members/:userId               Remove group member

POST   /spaces                                        Create space
GET    /spaces/workspace/:workspaceId                 List spaces
GET    /spaces/:id                                    Get space
PATCH  /spaces/:id                                    Update space
DELETE /spaces/:id                                    Delete space
POST   /spaces/:spaceId/statuses                      Add custom status
PATCH  /spaces/:spaceId/statuses/:statusId            Update custom status
DELETE /spaces/:spaceId/statuses/:statusId            Delete custom status

POST   /tasks                                         Create task
GET    /tasks/space/:spaceId                          List tasks in space (filters: status, assignee, priority)
GET    /tasks/assigned-to-me                          List tasks assigned to current user
GET    /tasks/:id                                     Get task
PATCH  /tasks/:id                                     Update task
PATCH  /tasks/:id/move                                Move task to different status/position
DELETE /tasks/:id                                     Delete task
POST   /tasks/:taskId/comments                        Add comment
GET    /tasks/:taskId/comments                        List comments
DELETE /tasks/:taskId/comments/:commentId             Delete comment
```
