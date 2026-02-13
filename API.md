# TeamUp Workspace Service API Documentation

**Base URL:** `http://localhost:3002`

---

## 📋 Table of Contents

1. [Workspaces](#workspaces)
2. [Channels](#channels)
3. [Groups](#groups)
4. [Workspace Members](#workspace-members)

---

## 🏢 Workspaces

### Create Workspace

**Endpoint:** `POST /workspaces`

**Description:** Creates a new workspace and automatically adds the owner as a member.

**Request Body:**
```json
{
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "user-123",
  "avatar": "https://example.com/avatar.png" // optional
}
```

**Validation:**
- `name` (required, string): Workspace name
- `slug` (required, string, unique): URL-friendly identifier
- `ownerId` (required, string): User ID of the workspace owner
- `avatar` (optional, string, URL): Workspace avatar image URL

**Response:** `201 Created`
```json
{
  "id": "ws-uuid-123",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "user-123",
  "avatar": "https://example.com/avatar.png",
  "createdAt": "2026-02-13T10:30:00.000Z",
  "updatedAt": "2026-02-13T10:30:00.000Z"
}
```

**Errors:**
- `409 Conflict` - Workspace with this slug already exists
- `400 Bad Request` - Invalid input data

**cURL Example:**
```bash
curl -X POST http://localhost:3002/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "user-123"
  }'
```

---

### List Workspaces

**Endpoint:** `GET /workspaces`

**Description:** Lists all workspaces, optionally filtered by user membership.

**Query Parameters:**
- `userId` (optional, string): Filter workspaces where user is a member

**Response:** `200 OK`
```json
[
  {
    "id": "ws-uuid-123",
    "name": "My Team",
    "slug": "my-team",
    "ownerId": "user-123",
    "avatar": "https://example.com/avatar.png",
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
]
```

**cURL Examples:**
```bash
# Get all workspaces
curl http://localhost:3002/workspaces

# Get workspaces for specific user
curl "http://localhost:3002/workspaces?userId=user-123"
```

---

### Get Workspace

**Endpoint:** `GET /workspaces/:id`

**Description:** Get a single workspace with members and channels.

**Path Parameters:**
- `id` (required): Workspace ID

**Response:** `200 OK`
```json
{
  "id": "ws-uuid-123",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "user-123",
  "avatar": "https://example.com/avatar.png",
  "createdAt": "2026-02-13T10:30:00.000Z",
  "updatedAt": "2026-02-13T10:30:00.000Z",
  "members": [
    {
      "id": "member-uuid-1",
      "workspaceId": "ws-uuid-123",
      "userId": "user-123",
      "role": "OWNER",
      "joinedAt": "2026-02-13T10:30:00.000Z"
    }
  ],
  "channels": [
    {
      "id": "channel-uuid-1",
      "workspaceId": "ws-uuid-123",
      "name": "general",
      "type": "PUBLIC",
      "description": "General discussion",
      "createdAt": "2026-02-13T10:35:00.000Z",
      "updatedAt": "2026-02-13T10:35:00.000Z"
    }
  ]
}
```

**Errors:**
- `404 Not Found` - Workspace not found

**cURL Example:**
```bash
curl http://localhost:3002/workspaces/ws-uuid-123
```

---

### Update Workspace

**Endpoint:** `PATCH /workspaces/:id`

**Description:** Update workspace details (name or avatar).

**Path Parameters:**
- `id` (required): Workspace ID

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "avatar": "https://example.com/new-avatar.png"
}
```

**Validation:**
- `name` (optional, string): New workspace name
- `avatar` (optional, string, URL): New avatar URL
- Note: Cannot update `slug` or `ownerId`

**Response:** `200 OK`
```json
{
  "id": "ws-uuid-123",
  "name": "Updated Team Name",
  "slug": "my-team",
  "ownerId": "user-123",
  "avatar": "https://example.com/new-avatar.png",
  "createdAt": "2026-02-13T10:30:00.000Z",
  "updatedAt": "2026-02-13T10:45:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Workspace not found
- `400 Bad Request` - Invalid input data

**cURL Example:**
```bash
curl -X PATCH http://localhost:3002/workspaces/ws-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Team Name"}'
```

---

### Delete Workspace

**Endpoint:** `DELETE /workspaces/:id`

**Description:** Delete a workspace and all related data (members, channels, etc.).

**Path Parameters:**
- `id` (required): Workspace ID

**Response:** `200 OK`
```json
{
  "id": "ws-uuid-123",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "user-123",
  "avatar": null,
  "createdAt": "2026-02-13T10:30:00.000Z",
  "updatedAt": "2026-02-13T10:30:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Workspace not found

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/workspaces/ws-uuid-123
```

---

## 🔷 Channels

### Create Channel

**Endpoint:** `POST /channels`

**Description:** Creates a new channel in a workspace.

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

**Response:** `201 Created`
```json
{
  "id": "channel-uuid-1",
  "workspaceId": "ws-uuid-123",
  "name": "general",
  "type": "PUBLIC",
  "description": "General discussion channel",
  "createdAt": "2026-02-13T10:35:00.000Z",
  "updatedAt": "2026-02-13T10:35:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid input or workspace doesn't exist

**cURL Example:**
```bash
curl -X POST http://localhost:3002/channels \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "ws-uuid-123",
    "name": "general",
    "type": "PUBLIC",
    "description": "General discussion"
  }'
```

---

### List Channels in Workspace

**Endpoint:** `GET /channels/workspace/:workspaceId`

**Description:** Get all channels in a workspace with members and groups.

**Path Parameters:**
- `workspaceId` (required): Workspace ID

**Response:** `200 OK`
```json
[
  {
    "id": "channel-uuid-1",
    "workspaceId": "ws-uuid-123",
    "name": "general",
    "type": "PUBLIC",
    "description": "General discussion",
    "createdAt": "2026-02-13T10:35:00.000Z",
    "updatedAt": "2026-02-13T10:35:00.000Z",
    "members": [
      {
        "id": "cm-uuid-1",
        "channelId": "channel-uuid-1",
        "userId": "user-123",
        "role": "MEMBER",
        "joinedAt": "2026-02-13T10:35:00.000Z"
      }
    ],
    "groups": []
  }
]
```

**cURL Example:**
```bash
curl http://localhost:3002/channels/workspace/ws-uuid-123
```

---

### Get Channel

**Endpoint:** `GET /channels/:id`

**Description:** Get a single channel with members and groups.

**Path Parameters:**
- `id` (required): Channel ID

**Response:** `200 OK`
```json
{
  "id": "channel-uuid-1",
  "workspaceId": "ws-uuid-123",
  "name": "general",
  "type": "PUBLIC",
  "description": "General discussion",
  "createdAt": "2026-02-13T10:35:00.000Z",
  "updatedAt": "2026-02-13T10:35:00.000Z",
  "members": [...],
  "groups": [...]
}
```

**Errors:**
- `404 Not Found` - Channel not found

**cURL Example:**
```bash
curl http://localhost:3002/channels/channel-uuid-1
```

---

### Update Channel

**Endpoint:** `PATCH /channels/:id`

**Description:** Update channel details.

**Path Parameters:**
- `id` (required): Channel ID

**Request Body:**
```json
{
  "name": "updated-general",
  "type": "PRIVATE",
  "description": "Updated description"
}
```

**Validation:**
- All fields are optional
- `type` must be `"PUBLIC"` or `"PRIVATE"` if provided

**Response:** `200 OK`
```json
{
  "id": "channel-uuid-1",
  "workspaceId": "ws-uuid-123",
  "name": "updated-general",
  "type": "PRIVATE",
  "description": "Updated description",
  "createdAt": "2026-02-13T10:35:00.000Z",
  "updatedAt": "2026-02-13T11:00:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Channel not found
- `400 Bad Request` - Invalid input data

**cURL Example:**
```bash
curl -X PATCH http://localhost:3002/channels/channel-uuid-1 \
  -H "Content-Type: application/json" \
  -d '{"name": "updated-general"}'
```

---

### Delete Channel

**Endpoint:** `DELETE /channels/:id`

**Description:** Delete a channel and all related data (members, groups, etc.).

**Path Parameters:**
- `id` (required): Channel ID

**Response:** `200 OK`
```json
{
  "id": "channel-uuid-1",
  "workspaceId": "ws-uuid-123",
  "name": "general",
  "type": "PUBLIC",
  "description": "General discussion",
  "createdAt": "2026-02-13T10:35:00.000Z",
  "updatedAt": "2026-02-13T10:35:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Channel not found

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/channels/channel-uuid-1
```

---

### Add Member to Channel

**Endpoint:** `POST /channels/:channelId/members`

**Description:** Add a user to a channel.

**Path Parameters:**
- `channelId` (required): Channel ID

**Request Body:**
```json
{
  "userId": "user-456",
  "role": "MEMBER"
}
```

**Validation:**
- `userId` (required, string): User ID to add
- `role` (optional, string): Member role (default: `"MEMBER"`)

**Response:** `201 Created`
```json
{
  "id": "cm-uuid-2",
  "channelId": "channel-uuid-1",
  "userId": "user-456",
  "role": "MEMBER",
  "joinedAt": "2026-02-13T11:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/channels/channel-uuid-1/members \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-456", "role": "MEMBER"}'
```

---

### Remove Member from Channel

**Endpoint:** `DELETE /channels/:channelId/members/:userId`

**Description:** Remove a user from a channel.

**Path Parameters:**
- `channelId` (required): Channel ID
- `userId` (required): User ID to remove

**Response:** `200 OK`
```json
{
  "count": 1
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/channels/channel-uuid-1/members/user-456
```

---

## 👥 Groups

### Create Group

**Endpoint:** `POST /groups`

**Description:** Create a group within a channel.

**Request Body:**
```json
{
  "channelId": "channel-uuid-1",
  "name": "Developers",
  "description": "Development team"
}
```

**Validation:**
- `channelId` (required, string): Parent channel ID
- `name` (required, string): Group name
- `description` (optional, string): Group description

**Response:** `201 Created`
```json
{
  "id": "group-uuid-1",
  "channelId": "channel-uuid-1",
  "name": "Developers",
  "description": "Development team",
  "createdAt": "2026-02-13T11:10:00.000Z",
  "updatedAt": "2026-02-13T11:10:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/groups \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel-uuid-1",
    "name": "Developers",
    "description": "Development team"
  }'
```

---

### List Groups in Channel

**Endpoint:** `GET /groups/channel/:channelId`

**Description:** Get all groups in a channel.

**Path Parameters:**
- `channelId` (required): Channel ID

**Response:** `200 OK`
```json
[
  {
    "id": "group-uuid-1",
    "channelId": "channel-uuid-1",
    "name": "Developers",
    "description": "Development team",
    "createdAt": "2026-02-13T11:10:00.000Z",
    "updatedAt": "2026-02-13T11:10:00.000Z",
    "members": [
      {
        "id": "gm-uuid-1",
        "groupId": "group-uuid-1",
        "userId": "user-123",
        "joinedAt": "2026-02-13T11:10:00.000Z"
      }
    ]
  }
]
```

**cURL Example:**
```bash
curl http://localhost:3002/groups/channel/channel-uuid-1
```

---

### Get Group

**Endpoint:** `GET /groups/:id`

**Description:** Get a single group with members.

**Path Parameters:**
- `id` (required): Group ID

**Response:** `200 OK`
```json
{
  "id": "group-uuid-1",
  "channelId": "channel-uuid-1",
  "name": "Developers",
  "description": "Development team",
  "createdAt": "2026-02-13T11:10:00.000Z",
  "updatedAt": "2026-02-13T11:10:00.000Z",
  "members": [...]
}
```

**Errors:**
- `404 Not Found` - Group not found

**cURL Example:**
```bash
curl http://localhost:3002/groups/group-uuid-1
```

---

### Update Group

**Endpoint:** `PATCH /groups/:id`

**Description:** Update group details.

**Path Parameters:**
- `id` (required): Group ID

**Request Body:**
```json
{
  "name": "Senior Developers",
  "description": "Senior development team"
}
```

**Response:** `200 OK`
```json
{
  "id": "group-uuid-1",
  "channelId": "channel-uuid-1",
  "name": "Senior Developers",
  "description": "Senior development team",
  "createdAt": "2026-02-13T11:10:00.000Z",
  "updatedAt": "2026-02-13T11:20:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Group not found

**cURL Example:**
```bash
curl -X PATCH http://localhost:3002/groups/group-uuid-1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Senior Developers"}'
```

---

### Delete Group

**Endpoint:** `DELETE /groups/:id`

**Description:** Delete a group and all memberships.

**Path Parameters:**
- `id` (required): Group ID

**Response:** `200 OK`
```json
{
  "id": "group-uuid-1",
  "channelId": "channel-uuid-1",
  "name": "Developers",
  "description": "Development team",
  "createdAt": "2026-02-13T11:10:00.000Z",
  "updatedAt": "2026-02-13T11:10:00.000Z"
}
```

**Errors:**
- `404 Not Found` - Group not found

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/groups/group-uuid-1
```

---

### Add Member to Group

**Endpoint:** `POST /groups/:groupId/members`

**Description:** Add a user to a group.

**Path Parameters:**
- `groupId` (required): Group ID

**Request Body:**
```json
{
  "userId": "user-789"
}
```

**Validation:**
- `userId` (required, string): User ID to add

**Response:** `201 Created`
```json
{
  "id": "gm-uuid-2",
  "groupId": "group-uuid-1",
  "userId": "user-789",
  "joinedAt": "2026-02-13T11:25:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/groups/group-uuid-1/members \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-789"}'
```

---

### Remove Member from Group

**Endpoint:** `DELETE /groups/:groupId/members/:userId`

**Description:** Remove a user from a group.

**Path Parameters:**
- `groupId` (required): Group ID
- `userId` (required): User ID to remove

**Response:** `200 OK`
```json
{
  "count": 1
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/groups/group-uuid-1/members/user-789
```

---

## 👤 Workspace Members

### Add Member to Workspace

**Endpoint:** `POST /workspaces/:workspaceId/members`

**Description:** Add a user to a workspace.

**Path Parameters:**
- `workspaceId` (required): Workspace ID

**Request Body:**
```json
{
  "userId": "user-456",
  "role": "MEMBER"
}
```

**Validation:**
- `userId` (required, string): User ID to add
- `role` (optional, string): Member role (default: `"MEMBER"`)
  - Possible values: `"OWNER"`, `"ADMIN"`, `"MEMBER"`

**Response:** `201 Created`
```json
{
  "id": "wm-uuid-2",
  "workspaceId": "ws-uuid-123",
  "userId": "user-456",
  "role": "MEMBER",
  "joinedAt": "2026-02-13T11:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/workspaces/ws-uuid-123/members \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-456", "role": "MEMBER"}'
```

---

### List Workspace Members

**Endpoint:** `GET /workspaces/:workspaceId/members`

**Description:** Get all members in a workspace.

**Path Parameters:**
- `workspaceId` (required): Workspace ID

**Response:** `200 OK`
```json
[
  {
    "id": "wm-uuid-1",
    "workspaceId": "ws-uuid-123",
    "userId": "user-123",
    "role": "OWNER",
    "joinedAt": "2026-02-13T10:30:00.000Z"
  },
  {
    "id": "wm-uuid-2",
    "workspaceId": "ws-uuid-123",
    "userId": "user-456",
    "role": "MEMBER",
    "joinedAt": "2026-02-13T11:30:00.000Z"
  }
]
```

**cURL Example:**
```bash
curl http://localhost:3002/workspaces/ws-uuid-123/members
```

---

### Update Member Role

**Endpoint:** `PATCH /workspaces/:workspaceId/members/:userId`

**Description:** Update a member's role in the workspace.

**Path Parameters:**
- `workspaceId` (required): Workspace ID
- `userId` (required): User ID

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Validation:**
- `role` (required, string): New role
  - Possible values: `"OWNER"`, `"ADMIN"`, `"MEMBER"`

**Response:** `200 OK`
```json
{
  "id": "wm-uuid-2",
  "workspaceId": "ws-uuid-123",
  "userId": "user-456",
  "role": "ADMIN",
  "joinedAt": "2026-02-13T11:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3002/workspaces/ws-uuid-123/members/user-456 \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

---

### Remove Member from Workspace

**Endpoint:** `DELETE /workspaces/:workspaceId/members/:userId`

**Description:** Remove a user from a workspace.

**Path Parameters:**
- `workspaceId` (required): Workspace ID
- `userId` (required): User ID to remove

**Response:** `200 OK`
```json
{
  "count": 1
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/workspaces/ws-uuid-123/members/user-456
```

---

## 📊 Common Response Codes

| Code | Status | Description |
|------|--------|-------------|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE (no body) |
| `400` | Bad Request | Invalid input data / validation error |
| `401` | Unauthorized | Authentication required (future) |
| `403` | Forbidden | Insufficient permissions (future) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., slug exists) |
| `500` | Internal Server Error | Server error |

---

## 🔐 Authentication

**Note:** Authentication is not yet implemented. All endpoints are currently public.

**Future implementation will include:**
- JWT-based authentication
- Authorization headers: `Authorization: Bearer <token>`
- Role-based access control (RBAC)
- Workspace ownership and permissions

---

## 📝 Notes

### Data Types

- **UUID:** All IDs are UUIDs (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- **DateTime:** ISO 8601 format (e.g., `"2026-02-13T10:30:00.000Z"`)
- **Enums:**
  - Channel type: `"PUBLIC"`, `"PRIVATE"`
  - Member roles: `"OWNER"`, `"ADMIN"`, `"MEMBER"`

### Cascading Deletes

- Deleting a **workspace** removes all channels, members, groups
- Deleting a **channel** removes all channel members and groups
- Deleting a **group** removes all group members

### Unique Constraints

- **Workspace slug** must be unique across all workspaces
- **User + Workspace** combination must be unique (can't add same user twice)
- **User + Channel** combination must be unique
- **User + Group** combination must be unique

---

## 🧪 Testing with cURL

### Complete Workflow Example

```bash
# 1. Create workspace
curl -X POST http://localhost:3002/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Dev Team","slug":"dev-team","ownerId":"user-1"}'
# Returns: {"id":"ws-123",...}

# 2. Create channel
curl -X POST http://localhost:3002/channels \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"ws-123","name":"general","type":"PUBLIC"}'
# Returns: {"id":"ch-456",...}

# 3. Add member to workspace
curl -X POST http://localhost:3002/workspaces/ws-123/members \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-2","role":"MEMBER"}'

# 4. Add member to channel
curl -X POST http://localhost:3002/channels/ch-456/members \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-2"}'

# 5. Create group
curl -X POST http://localhost:3002/groups \
  -H "Content-Type: application/json" \
  -d '{"channelId":"ch-456","name":"Frontend Team"}'
# Returns: {"id":"gr-789",...}

# 6. Add member to group
curl -X POST http://localhost:3002/groups/gr-789/members \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-2"}'

# 7. List everything
curl http://localhost:3002/workspaces/ws-123
curl http://localhost:3002/channels/workspace/ws-123
curl http://localhost:3002/groups/channel/ch-456
```

---

**Last Updated:** February 13, 2026  
**API Version:** 1.0.0  
**Service:** Workspace Service (Port 3002)
