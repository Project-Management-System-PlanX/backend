# 🧠 TeamUp Technical Deep Dive

This document outlines the intricate details of the TeamUp architecture, data flow, and common technical pitfalls.

---

## 🏗️ Microservices Architecture Detail

While the project is split into services like `workspace-service` and `meeting-service`, they share significant infrastructure:

### 1. Shared Database Strategy
*   **Physical Layer**: All services connect to the SAME Supabase PostgreSQL instance.
*   **Prisma Client Isolation**: Each service generates its OWN Prisma client in a custom nested directory (`@prisma/client-workspace`, `@prisma/client-meeting`).
*   **Conflict Warning**: If you modify a table that is referenced by multiple services (e.g., `users`, `workspaces`, `channels`), you MUST ensure the schemas match in BOTH services. Failure to do so will cause Prisma synchronization errors.

### 2. Authentication Flow (Shared Logic)
*   **Frontend**: Uses `@supabase/supabase-js` to log in and get a JWT.
*   **Backend**: Each service uses a **Shared Supabase Auth Guard** (located in `shared/auth`).
*   **Token Validation**: The backend does NOT call Supabase for every request. It validates the JWT locally using the `SUPABASE_JWT_SECRET`.
*   **Intricate Detail**: Ensure the `SUPABASE_JWT_SECRET` in your `.env` matches the one in your Supabase Project Settings (API tab).

### 3. Real-time Communication
*   **Mechanism**: The app currently uses **Supabase Postgres Changes** for real-time updates.
*   **Workflow**: 
    1.  Frontend/Backend modifies a record in the database.
    2.  PostgreSQL triggers the change.
    3.  Supabase Realtime server broadcasts the update to all subscribed clients.
*   **WebSocket Hub (Port 4000)**: This is currently a secondary/legacy option. Most instant features (Chat, Task changes) are handled via the Supabase client.

---

## ⚡ Performance & Connection Pooling

Supabase has strict connection limits. In a microservices setup, multiple services can quickly exhaust the pool.

### Transaction vs. Session Poolers
*   **App Runtime**: Use Port `6543` (`DATABASE_URL`). This uses **PgBouncer** for transaction pooling, allowing many more concurrent connections.
*   **Migrations**: Use Port `5432` (`DIRECT_URL`). Migrations require a direct session connection. If you try to run `npx prisma migrate` on port 6543, it will fail.

---

## 🧩 Shared Module Resolution

The backend uses a `shared/` directory for common utilities.
*   **Import Aliases**: Look at `tsconfig.json`. We use aliases like `@shared/*` to keep imports clean.
*   **Circular Dependencies**: Be careful when adding shared logic. If `shared/utils` imports from a service, and that service imports from `shared/utils`, the app will crash on startup with a `Nest cannot find module` error.

---

## 🔧 Debugging Intricacies

*   **Zombie Processes**: If you stop the dev server and can't restart because of a "Port already in use" error, it's often because a `node` process is still running in the background. Use `lsof -i :3002,3005` to find and kill it.
*   **Prisma Client Drift**: If you get errors like `property X does not exist on type Y`, but the database looks correct, run `npm run db:generate` to rebuild the local TypeScript interfaces.
