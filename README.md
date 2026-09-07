# NestJS RBAC Starter Template

A clean, production-ready Role-Based Access Control (RBAC) starter built with NestJS + TypeORM + MySQL. Use this as the foundation for any project — school management, e-commerce, delivery, SaaS, etc. — without any domain-specific code included.

---

## What's Included

### Authentication
| Surface | Details |
|---|---|
| Admin auth | Login, logout, get profile, change password — JWT via `AdminJwtAuthGuard` |
| User auth | Register, login, logout, get profile, update profile, change password, refresh token — JWT via `UserJwtAuthGuard` |
| Token strategy | Short-lived access tokens (30 min) + long-lived refresh tokens (7 days), both stored on the entity and validated on each request (revocation-safe) |

### RBAC Core
| Feature | Prefix | Notes |
|---|---|---|
| Roles | `admin/roles` | Create/read/update/delete/toggleStatus — `guard` field scopes roles to `admin` or `user` |
| Permissions | `admin/permissions` | Module + action + name + guard |
| Role → Permission | `admin/role-permissions` | Assign permissions to roles |
| Admin → Role | `admin/roles-assigning-admin` | Assign roles to admin accounts |
| User → Role | `admin/roles-assigning-user` | Assign roles to user accounts |
| Admin → Permission | `admin/permission-assigning-admin` | Assign permissions directly to admins |
| User → Permission | `admin/permission-assigning-user` | Assign permissions directly to users |

### User & Admin Management
| Feature | Prefix | Notes |
|---|---|---|
| Admin CRUD | `admin/` | Create, list, find, update (PUT), delete, toggleStatus |
| User CRUD | `admin/users/` | Create, list, find by ID, find by email, update (PUT), toggleStatus |

### Guards & Decorators
- `AdminJwtAuthGuard` — protects all `admin/*` routes
- `UserJwtAuthGuard` — protects authenticated `user/*` routes
- `RolesGuard` — checks `@Roles(...)` metadata; roles are dynamic strings matched against the JWT payload
- `@Roles(...roles)` — generic decorator, no hardcoded role names anywhere in the codebase
- `@CurrentUser()` — extracts the authenticated user from the request

### Seeders (run on bootstrap)
- **Roles seeder** — seeds `admin`, `manager`, `user` roles on first start
- **Admin seeder** — seeds a default super-admin account (`admin@example.com` / `123456789`) if none exists
- **User seeder** — seeds a default user account (`user@example.com` / `123456789`) if none exists

---

## Entities / Tables

| Entity | Table | Purpose |
|---|---|---|
| `Admin` | `admin` | Admin accounts |
| `User` | `user` | End-user accounts |
| `Role` | `role` | Named roles scoped to `admin` or `user` guard |
| `Permission` | `permission` | Granular permissions (module + action) |
| `RolePermissions` | `role_permissions` | Many-to-many: Role ↔ Permission |
| `AdminRole` | `admin_role` | Many-to-many: Admin ↔ Role |
| `UserRole` | `user_role` | Many-to-many: User ↔ Role |
| `AdminPermission` | `admin_permissions` | Many-to-many: Admin ↔ Permission (direct) |
| `UserPermission` | `user_permissions` | Many-to-many: User ↔ Permission (direct) |

**9 tables total.** No domain-specific tables.

---

## Environment Setup

Create a `.env` file at the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=rbac_starter
```

Install dependencies and start:

```bash
npm install
npm run start:dev
```

TypeORM `synchronize: true` is enabled — tables are auto-created on first run.

---

## How to Add a New Domain Module

Follow these steps to bolt a new feature (e.g. "Products", "Courses", "Orders") onto this template without touching the RBAC core.

### Step 1 — Generate the module

```bash
nest g module products
nest g service products
nest g controller products
```

### Step 2 — Create your entity

```typescript
// src/products/entity/product.entity.ts
@Entity()
export class Product {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() price: number;
  // ... your domain fields
}
```

### Step 3 — Wire it into the module

```typescript
// src/products/products.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

### Step 4 — Protect routes with the appropriate guard

```typescript
// Admin-managed resource
@Controller('admin/products')
@UseGuards(AdminJwtAuthGuard)
export class ProductsController { ... }

// User-facing resource
@Controller('products')
@UseGuards(UserJwtAuthGuard)
export class ProductsController { ... }
```

### Step 5 — Apply role-based restrictions (optional)

Use `@Roles()` with dynamic strings that match role names in your database. Do **not** hardcode role names — seed them via the roles seeder or the API instead.

```typescript
@Get('dashboard')
@UseGuards(UserJwtAuthGuard, RolesGuard)
@Roles('manager', 'supervisor')  // match names from the `role` table
getDashboard() { ... }
```

### Step 6 — Seed the required roles and permissions via the API

1. `POST /admin/roles/store` — create a `products.manager` role with `guard: admin`
2. `POST /admin/permissions/store` — create `products.create`, `products.read`, etc.
3. `POST /admin/role-permissions/store` — link permissions to roles
4. `POST /admin/roles-assigning-admin/store` — assign roles to admin accounts

### Step 7 — Import the module in AppModule

```typescript
// src/app.module.ts
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // ... existing RBAC modules
    ProductsModule,
  ],
})
export class AppModule { ... }
```

---

## Project Structure

```
src/
├── admin/                        # Admin entity + CRUD + seeder
├── auth/
│   ├── admin/                    # AdminJwtAuthGuard, strategy, auth controller
│   └── user/                     # UserJwtAuthGuard, strategy, auth controller + seeder
├── assig-roles-admin/            # Admin ↔ Role assignment
├── assig-roles-user/             # User ↔ Role assignment
├── assign-permission-admin/      # Admin ↔ Permission assignment
├── assign-permission-user/       # User ↔ Permission assignment
├── common/
│   ├── decorators/               # @CurrentUser(), @Roles(), @Match()
│   ├── guards/                   # RolesGuard
│   └── utils/                    # multerConfig, sanitizeUser
├── permissions/                  # Permission entity + CRUD
├── role-permissions/             # RolePermission entity + CRUD
├── roles/                        # Role entity + CRUD + seeder
└── users/                        # User entity + CRUD
```

---

## Notes

- JWT secrets are currently hardcoded strings (`admin-secret-key`, `user-secret-key`). Move these to `.env` before deploying to production.
- `synchronize: true` is convenient for development. Disable it in production and use TypeORM migrations instead.
- The `RolesGuard` reads roles from the JWT payload (set at login time). If you reassign a user's role, they need to re-login for the new role to take effect in their token.
