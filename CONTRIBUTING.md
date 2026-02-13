# Contributing to TeamUp Backend

Thank you for contributing! Please follow these guidelines to maintain code quality and consistency.

## 🚀 Quick Start for Contributors

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/backend.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run install:all
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your Aiven and Upstash credentials
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 📝 Code Style & Conventions

### **Naming Conventions**

- **kebab-case** for files: `user-service.ts`, `auth-controller.ts`
- **PascalCase** for classes: `UserService`, `AuthController`, `CreateWorkspaceDto`
- **camelCase** for variables/functions: `getUserById`, `workspaceData`, `isAuthenticated`
- **SCREAMING_SNAKE_CASE** for constants: `MAX_RETRIES`, `DATABASE_URL`, `API_VERSION`

### **Code Quality Rules**

- ✅ **No magic strings or numbers** — use named constants
- ✅ **Self-documenting code** — avoid unnecessary comments
- ✅ **Small, focused functions** — single responsibility principle
- ✅ **Proper error handling** — never swallow errors silently
- ✅ **Type safety** — avoid `any`, use proper TypeScript types
- ❌ **No LLM-generated comments** — code should speak for itself
- ❌ **No blaming LLMs** — you own your code

---

## 🏗️ NestJS Patterns

### **Module Structure**

Every feature follows this pattern:

```
feature/
├── feature.module.ts      # NestJS module definition
├── feature.controller.ts  # HTTP endpoints (thin layer)
├── feature.service.ts     # Business logic
├── feature.repository.ts  # Database operations (optional)
└── dto/
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### **Controller Example**

```typescript
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }
}
```

**Rules:**
- Keep controllers thin — no business logic
- Use DTOs for validation
- Return service results directly

### **Service Example**

```typescript
@Injectable()
export class UsersService {
    constructor(private prisma: PrismaClient) {}

    async create(dto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email already exists');
        }

        return this.prisma.user.create({ data: dto });
    }
}
```

**Rules:**
- All business logic goes here
- Use Prisma for database operations
- Throw NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Use transactions for multi-table operations

---

## 🗄️ Database & Prisma

### **Creating Migrations**

```bash
cd services/workspace-service
npx prisma migrate dev --name add_user_avatar
```

**Migration naming:**
- `add_column_name` — Adding new column
- `create_table_name` — Creating new table
- `remove_column_name` — Removing column
- `alter_table_name` — Modifying table structure

### **Schema Best Practices**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  avatar    String?  // Optional field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspaces WorkspaceMember[]

  @@map("users")           // Table name in database
  @@index([email])         // Index for performance
}
```

**Rules:**
- Use `uuid()` for IDs
- Add `createdAt` and `updatedAt` to all models
- Use `@@map()` for snake_case table names
- Add indexes on frequently queried fields
- Use proper relations (`@relation`)

### **Avoiding N+1 Queries**

❌ **Bad:**
```typescript
const workspaces = await prisma.workspace.findMany();
for (const workspace of workspaces) {
    workspace.members = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
    });
}
```

✅ **Good:**
```typescript
const workspaces = await prisma.workspace.findMany({
    include: { members: true },
});
```

---

## 🔐 API Design

### **RESTful Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/resources` | List all resources |
| `GET` | `/resources/:id` | Get one resource |
| `POST` | `/resources` | Create resource |
| `PATCH` | `/resources/:id` | Partial update |
| `PUT` | `/resources/:id` | Full update |
| `DELETE` | `/resources/:id` | Delete resource |

### **Query Parameters**

```typescript
@Get()
findAll(
    @Query('userId') userId?: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
) {
    return this.service.findAll({ userId, limit, offset });
}
```

### **HTTP Status Codes**

- `200 OK` — Successful GET, PATCH, PUT
- `201 Created` — Successful POST
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Not authenticated
- `403 Forbidden` — Not authorized
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Duplicate resource
- `500 Internal Server Error` — Server error

---

## 🧪 Testing

### **Unit Tests (Services)**

```typescript
describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaClient;

    beforeEach(() => {
        prisma = new PrismaClient();
        service = new UsersService(prisma);
    });

    it('should create a user', async () => {
        const dto = { email: 'test@example.com', name: 'Test' };
        const result = await service.create(dto);
        expect(result.email).toBe(dto.email);
    });

    it('should throw on duplicate email', async () => {
        await service.create({ email: 'test@example.com', name: 'Test' });
        await expect(
            service.create({ email: 'test@example.com', name: 'Test2' })
        ).rejects.toThrow(ConflictException);
    });
});
```

### **Integration Tests (Controllers)**

```typescript
describe('UsersController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    it('/users (POST)', () => {
        return request(app.getHttpServer())
            .post('/users')
            .send({ email: 'test@example.com', name: 'Test' })
            .expect(201);
    });
});
```

---

## 📦 Dependencies

### **Installing Packages**

```bash
# Production dependency
npm install package-name --workspace=services/workspace-service

# Development dependency
npm install -D package-name --workspace=services/workspace-service
```

### **Production vs Dev Dependencies**

✅ **Production (`dependencies`):**
- Runtime packages: `@nestjs/common`, `prisma`, `redis`
- Required for the app to run

✅ **Development (`devDependencies`):**
- Build tools: `typescript`, `@nestjs/cli`
- Testing: `jest`, `@types/*`
- Only needed during development

---

## 🔀 Git Workflow

### **1. Create Feature Branch**

```bash
git checkout main
git pull --rebase origin main
git checkout -b feature/add-user-authentication
```

### **2. Make Changes**

- Write code following conventions
- Test your changes locally
- Commit frequently with good messages

### **3. Commit with Conventional Commits**

```bash
git add .
git commit -m "feat: add user authentication endpoint"
```

**Commit types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring (no functional change)
- `docs:` — Documentation only
- `test:` — Adding/updating tests
- `chore:` — Maintenance (dependencies, config)
- `perf:` — Performance improvement
- `style:` — Code style (formatting, no logic change)

**Examples:**
```bash
git commit -m "feat: add user profile endpoint"
git commit -m "fix(auth): resolve token expiration bug"
git commit -m "refactor: optimize database queries"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for user service"
git commit -m "chore: update dependencies"
```

### **4. Pull with Rebase**

```bash
git pull --rebase origin main
```

If conflicts occur:
```bash
# Resolve conflicts in your editor
git add .
git rebase --continue
```

### **5. Push Changes**

```bash
git push origin feature/add-user-authentication
```

### **6. Open Pull Request**

- Go to GitHub
- Click "Compare & pull request"
- Fill in description with:
  - What changed
  - Why it changed
  - Link to related issues
  - Screenshots (if UI changes)
- Request review from team members

---

## 🛠️ Pre-commit Hooks

Husky runs these checks before every commit:

1. **Lint & Format** — Biome checks code style
2. **Commit Message** — Validates Conventional Commits format

If checks fail, fix the issues and commit again.

### **Bypass Hooks (Emergency Only)**

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Only use this in emergencies!**

---

## ✅ Pull Request Checklist

Before submitting a PR:

- [ ] Code follows naming conventions
- [ ] No magic strings or numbers
- [ ] Proper error handling implemented
- [ ] DTOs added for all API inputs
- [ ] Database migrations created (if schema changed)
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs (use logger)
- [ ] Environment variables added to `.env.example`
- [ ] Commit messages follow Conventional Commits
- [ ] PR description is clear and complete

---

## 🚨 Common Mistakes to Avoid

❌ **Don't:**
- Put business logic in controllers
- Use `any` type in TypeScript
- Hardcode values (URLs, API keys, etc.)
- Modify existing migrations
- Force push to shared branches
- Commit `.env` files
- Leave `console.log` statements
- Write unclear commit messages
- Skip testing

✅ **Do:**
- Keep controllers thin
- Use proper TypeScript types
- Use environment variables
- Create new migrations
- Pull with rebase
- Use `.env.example` for templates
- Use NestJS logger
- Follow Conventional Commits
- Test thoroughly

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

---

## 💬 Getting Help

- **Issues:** [GitHub Issues](https://github.com/Project-Management-System-PlanX/backend/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Project-Management-System-PlanX/backend/discussions)
- **Team Chat:** [Your Team Channel]

---

**Thank you for contributing! 🎉**
