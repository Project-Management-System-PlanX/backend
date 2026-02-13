# Prisma Commands - Correct Usage

## ⚠️ Issue: "Maximum call stack size exceeded"

This happens when running Prisma commands from the **service directory** due to npm workspace configuration.

---

## ✅ Solution: Run from ROOT Directory

### Always use this pattern:
```bash
cd /home/thiru/planX/backend  # ← Go to ROOT
npx prisma [command] --schema=./services/workspace-service/prisma/schema.prisma
```

---

## 📋 Common Prisma Commands

### 1. Open Prisma Studio (Database UI)
```bash
cd /home/thiru/planX/backend
npx prisma studio --schema=./services/workspace-service/prisma/schema.prisma
```
Opens browser at `http://localhost:5555`

### 2. Run Migrations (Create Tables)
```bash
cd /home/thiru/planX/backend
npx prisma migrate dev --name init --schema=./services/workspace-service/prisma/schema.prisma
```

### 3. Generate Prisma Client
```bash
cd /home/thiru/planX/backend
npx prisma generate --schema=./services/workspace-service/prisma/schema.prisma
```

### 4. Check Database Schema
```bash
cd /home/thiru/planX/backend
npx prisma db pull --schema=./services/workspace-service/prisma/schema.prisma
```

### 5. Reset Database (⚠️ Deletes All Data)
```bash
cd /home/thiru/planX/backend
npx prisma migrate reset --schema=./services/workspace-service/prisma/schema.prisma
```

### 6. Format Schema File
```bash
cd /home/thiru/planX/backend
npx prisma format --schema=./services/workspace-service/prisma/schema.prisma
```

---

## 🎯 Quick Reference

| Command | What it does |
|---------|-------------|
| `prisma studio` | Open database browser UI |
| `prisma migrate dev` | Create/apply migrations |
| `prisma generate` | Generate TypeScript client |
| `prisma db pull` | Pull schema from database |
| `prisma db push` | Push schema to database (no migration) |
| `prisma migrate reset` | Reset database & reapply migrations |

---

## 💡 Why This Happens

The npm workspace setup causes Prisma to recursively search for configuration, leading to a stack overflow when run from the service directory.

**Solution:** Always run from root with `--schema` flag.

---

## 🚀 Try Prisma Studio Now

```bash
cd /home/thiru/planX/backend
npx prisma studio --schema=./services/workspace-service/prisma/schema.prisma
```

This will open a browser UI where you can:
- ✅ View all tables
- ✅ Browse data
- ✅ Add/edit/delete records
- ✅ Test your database connection

**Note:** You still need to whitelist your IP (14.96.234.22) in Aiven first!
