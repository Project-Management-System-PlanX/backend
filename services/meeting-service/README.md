# Meeting Service

NestJS backend service for Livekit video/audio calls with Supabase database integration.

## Setup

### 1. Install dependencies

```bash
cd services/meeting-service
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_KEY` - Supabase service key (for admin operations)
- `LIVEKIT_API_KEY` - Livekit API key
- `LIVEKIT_API_SECRET` - Livekit API secret
- `LIVEKIT_URL` - Livekit WebSocket URL (e.g., `wss://your-project.livekit.cloud`)

### 3. Run the SQL migration in Supabase

Execute this SQL in your Supabase SQL Editor:

```sql
-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'VIDEO',
  status TEXT DEFAULT 'ACTIVE',
  group_id TEXT,
  channel_id TEXT,
  workspace_id TEXT,
  created_by_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting participants table
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration INTEGER,
  UNIQUE(meeting_id, user_id)
);

-- Indexes
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_room_id ON meetings(room_id);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(user_id);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Users can create meetings" ON meetings FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "Creator can update" ON meetings FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "Users can view participants" ON meeting_participants FOR SELECT USING (true);
CREATE POLICY "Users can join" ON meeting_participants FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 4. Start the service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

All endpoints require authentication via Supabase JWT token in the `Authorization` header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Create a meeting
```
POST /api/meetings/create
Body: { title: string, groupId?: string, channelId?: string, workspaceId?: string, type?: 'VIDEO' | 'AUDIO' }
```

### Join a meeting
```
POST /api/meetings/:id/join
Body: { username?: string }
Response: { token: string, url: string, meeting: Meeting }
```

### Leave a meeting
```
POST /api/meetings/:id/leave
```

### End a meeting (creator only)
```
POST /api/meetings/:id/end
```

### Get active meetings
```
GET /api/meetings/active?groupId=<optional>
```

### Get meeting history
```
GET /api/meetings/history
```

### Get meeting by ID
```
GET /api/meetings/:id
```

## Folder Structure

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── auth/
│   └── supabase-auth.guard.ts # JWT authentication guard
├── supabase/
│   ├── supabase.module.ts     # Supabase module (global)
│   └── supabase.service.ts    # Supabase client service
├── livekit/
│   ├── livekit.module.ts      # Livekit module
│   └── livekit.service.ts     # Livekit token generation
└── meetings/
    ├── meetings.module.ts     # Meetings module
    ├── meetings.controller.ts # REST endpoints
    ├── meetings.service.ts    # Business logic
    └── dto/
        ├── create-meeting.dto.ts
        └── join-meeting.dto.ts
```
