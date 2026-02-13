# 🔥 Database Connection Issue - SOLUTION

## ❌ Error You're Seeing

```
Error: P1001: Can't reach database server at `pg-17aa0356-suryathirupks-2b02.f.aivencloud.com:12816`
```

## ✅ Root Cause

**Aiven requires IP whitelisting** - Your local machine's IP address needs to be added to the allowed list.

---

## 🔧 Fix: Allow Your IP in Aiven

### Step 1: Get Your Public IP

```bash
curl ifconfig.me
```

Copy the IP address (e.g., `203.0.113.45`)

### Step 2: Whitelist IP in Aiven Console

1. Go to **Aiven Console**: https://console.aiven.io
2. Click on your project: **`suryathirupks-2b02`**
3. Click on **`teamup-workspace`** database
4. Go to **"Overview"** tab
5. Scroll down to **"Allowed IP Addresses"** section
6. Click **"Change"** or **"Add IP address"**
7. Add your IP: `YOUR_IP/32` (e.g., `203.0.113.45/32`)
   - Or use `0.0.0.0/0` to allow from anywhere (⚠️ less secure, only for testing)
8. Click **"Save changes"**

### Step 3: Wait 1-2 Minutes

Aiven needs time to apply the firewall rules.

### Step 4: Test Connection Again

```bash
cd /home/thiru/planX/backend
npx prisma migrate dev --name init --schema=./services/workspace-service/prisma/schema.prisma
```

---

## 🎯 Alternative: Check if Database is Running

In Aiven Console:
1. Click **`teamup-workspace`**
2. Check the status indicator (should be green/running)
3. If it says "Rebuilding" or "Stopped", wait for it to start

---

## 📊 Visual Guide

```
Your Computer (IP: 203.0.113.45)
        ↓
        ❌ BLOCKED (Firewall)
        ↓
Aiven Database (pg-17aa0356...aivencloud.com:12816)

After whitelisting:

Your Computer (IP: 203.0.113.45)
        ↓
        ✅ ALLOWED
        ↓
Aiven Database (pg-17aa0356...aivencloud.com:12816)
```

---

## 🔍 Verify Connection

After whitelisting, test with:

```bash
# Test port connectivity
nc -zv pg-17aa0356-suryathirupks-2b02.f.aivencloud.com 12816

# Should output: "Connection succeeded"
```

---

## ⚡ Quick Fix (Allow All IPs - Testing Only)

If you just want to test quickly:

1. In Aiven → `teamup-workspace` → **Allowed IP Addresses**
2. Add: `0.0.0.0/0`
3. This allows connections from **any IP** (⚠️ not recommended for production)

---

## 🎯 Once Connected, Run Migration

```bash
cd /home/thiru/planX/backend

# This will create all tables in your Aiven database
npx prisma migrate dev --name init --schema=./services/workspace-service/prisma/schema.prisma
```

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied migration init

The following migration(s) have been created and applied:

migrations/
  └─ 20260212_init/
      └─ migration.sql

✔ Generated Prisma Client
```

---

## 📝 What Gets Created

After successful migration, these tables will be in your Aiven database:

- ✅ `workspaces`
- ✅ `workspace_members`
- ✅ `channels`
- ✅ `channel_members`
- ✅ `groups`
- ✅ `group_members`

You can verify in:
- **Aiven Console** → `teamup-workspace` → **Tables** tab
- Or run: `npx prisma studio` (opens browser UI)

---

## 🚨 Still Not Working?

### Check Database URL Format

Your URL should look like:
```
postgres://avnadmin:PASSWORD@HOST:PORT/teamup-workspace?sslmode=require
```

Make sure:
- ✅ Protocol is `postgres://` (not `postgresql://`)
- ✅ Database name is `teamup-workspace` (not `defaultdb`)
- ✅ Has `?sslmode=require` at the end

### Check Aiven Service Status

In Aiven Console, check if the database shows:
- ✅ Status: **Running** (green)
- ❌ Status: **Rebuilding** or **Stopped** (wait for it to start)

---

## 💡 Next Steps After Migration

Once migration succeeds:

1. ✅ Tables are created in Aiven
2. ✅ Prisma Client is generated
3. 🚀 Start the service:
   ```bash
   cd services/workspace-service
   npx tsc --build --force
   node dist/main.js
   ```

4. 🧪 Test API:
   ```bash
   curl -X POST http://localhost:3002/workspaces \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","slug":"test","ownerId":"user-123"}'
   ```
