# 📁 Project Structure - Cấu Trúc Dự Án

Tài liệu này giải thích cấu trúc folder và mục đích của từng phần trong codebase, giúp bạn hiểu nơi cần thêm code mới và cách tổ chức các phần khác nhau.

---

## 📂 Root Directory Structure

```
english-learning-website/
├── frontend/          # Frontend React application
├── backend/           # Backend PHP API
├── db/                # Database initialization scripts
├── docker-compose.yml # Docker orchestration
└── *.md               # Documentation files
```

---

## 🎨 Frontend Structure (`frontend/`)

### Root Level
```
frontend/
├── src/               # Source code (main directory)
├── public/            # Static assets (images, icons, etc.)
├── package.json       # Dependencies & scripts
├── vite.config.ts     # Vite build configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── *.md               # Frontend documentation
```

### Source Code (`src/`)

#### `src/main.tsx`
**Mục đích:** Entry point của ứng dụng
- Khởi tạo React app
- Setup providers (React Query, Router, etc.)
- Render root component

#### `src/pages/`
**Mục đích:** Route-level page components
- Mỗi file/page tương ứng với một route
- Pattern: Một route = một page component
- Có thể có folder structure cho pages phức tạp (như Blog/, Profile/)

**Cấu trúc:**
```
pages/
├── index.tsx          # Landing page (/)
├── Login.tsx          # Login page (/login)
├── Register.tsx       # Register page (/register)
├── Blog/              # Blog feature (folder structure)
│   ├── index.tsx      # Blog list (/blog)
│   ├── PostDetail.tsx # Post detail (/blog/:slug)
│   ├── CreatePost.tsx # Create/Edit (/blog/create, /blog/edit/:id)
│   └── components/    # Blog-specific components
├── Profile/           # Profile feature
│   ├── index.tsx      # Profile page (/profile)
│   └── Settings.tsx   # Settings page (/settings)
└── Admin/             # Admin pages (/admin/*)
```

**Khi thêm feature mới:**
- Tạo file `.tsx` đơn giản nếu chỉ có 1 page
- Tạo folder nếu có nhiều pages liên quan (như Blog, Profile)

#### `src/routers/`
**Mục đích:** Routing configuration
- Định nghĩa tất cả routes của ứng dụng
- Protected routes với authentication/authorization
- Route guards (ProtectedRoute component)

**Files:**
- `routes.tsx` - Centralized route definitions
- `ProtectedRoute.tsx` - Route guard component

**Khi thêm route mới:**
1. Import page component
2. Thêm route vào `routes.tsx`
3. Wrap với `<ProtectedRoute>` nếu cần authentication

#### `src/services/`
**Mục đích:** API service layers
- Gọi API endpoints
- Type-safe API calls
- Error handling

**Cấu trúc:**
```
services/
├── http/
│   └── api.ts         # Base API client
├── auth/              # Auth-related API calls
├── blog/              # Blog API calls
│   └── blog-api.ts    # Blog service methods
├── courses/           # Course API calls
├── forum/             # Forum API calls
├── profile/           # Profile API calls
└── admin/             # Admin API calls
```

**Khi thêm feature mới:**
- Tạo folder mới (ví dụ: `courses/`)
- Tạo file service (ví dụ: `courses-api.ts`)
- Export methods để sử dụng trong React Query hooks

#### `src/store/`
**Mục đích:** State management
- **Client state** (Zustand) - UI state, auth status
- **Server state** (React Query) - API data, mutations

**Cấu trúc:**
```
store/
├── client/            # Client state (Zustand stores)
│   ├── auth-store.ts  # Authentication state
│   └── ui-store.ts    # UI state (modals, sidebar, theme)
├── server/            # Server state (React Query hooks)
│   ├── auth-queries.ts # Auth queries/mutations
│   ├── blog-queries.ts # Blog queries/mutations
│   └── user-queries.ts # User queries/mutations
└── config/            # Configuration
    └── query-client.ts # React Query config & query keys
```

**Khi thêm feature mới:**
- **Client state** → Thêm vào `client/` (nếu cần UI state)
- **Server state** → Tạo file mới trong `server/` (ví dụ: `courses-queries.ts`)
- Export từ `store/server/index.ts`

#### `src/shared/`
**Mục đích:** Shared resources (dùng chung trong toàn bộ app)

**Cấu trúc:**
```
shared/
├── components/        # Reusable React components
│   ├── layout/        # Layout components (Header, Footer, Sidebar)
│   ├── ui/            # UI primitives (Button, Card, Dialog, etc.)
│   └── feedback/      # Feedback components (Toast, Alert)
├── hooks/             # Reusable custom hooks
│   ├── useAuth.tsx    # Auth hook (unified)
│   ├── use-mobile.tsx # Mobile detection hook
│   └── use-toast.ts   # Toast notification hook
├── lib/               # Library utilities
│   └── utils.ts       # Helper functions
├── types/             # TypeScript type definitions
├── constants/         # Constants (config values)
└── utils/             # Utility functions
```

**Khi thêm:**
- **Components dùng chung** → `shared/components/`
- **Hooks dùng chung** → `shared/hooks/`
- **Utilities** → `shared/lib/` hoặc `shared/utils/`

#### `src/styles/`
**Mục đích:** Global styles
- `global.css` - Global CSS, Tailwind imports, CSS variables

#### `src/assets/`
**Mục đích:** Static assets
- Images, fonts, icons, etc.
- Files không cần build process

---

## 🔧 Backend Structure (`backend/`)

### Root Level
```
backend/
├── api/               # PHP API application
└── storage/           # Storage files (uploads, logs, etc.)
```

### API Directory (`backend/api/`)

#### `backend/api/public/`
**Mục đích:** Public-facing API endpoints
- Entry point cho tất cả API requests
- Routing logic
- CORS handling

**Cấu trúc:**
```
public/
├── index.php          # Main router (entry point)
└── api/               # API endpoints
    ├── auth/          # Auth endpoints
    │   └── auth.php   # Login, register, logout, etc.
    ├── users/         # User endpoints
    │   └── users.php  # Get users, get user by ID
    ├── blog/          # Blog endpoints
    │   └── blog.php   # CRUD posts, comments, likes
    ├── courses/       # Course endpoints (future)
    └── forum/         # Forum endpoints (future)
```

**Khi thêm feature mới:**
1. Tạo folder mới trong `api/` (ví dụ: `courses/`)
2. Tạo file PHP (ví dụ: `courses.php`)
3. Thêm route vào `index.php`

#### `backend/api/helpers/`
**Mục đích:** Helper classes (reusable utilities)

**Files:**
- `Database.php` - Database connection singleton
- `Auth.php` - Authentication & authorization logic
- `Response.php` - JSON response helper

**Khi cần:**
- Thêm helper class mới nếu có logic dùng chung

---

## 🗄️ Database Structure (`db/`)

### Directory
```
db/
└── init/              # Initialization scripts
    ├── init.sql       # Main database schema (users, sessions)
    └── blog.sql       # Blog tables (blog_posts, blog_comments, blog_likes)
```

**Mục đích:**
- SQL scripts chạy tự động khi MySQL container khởi động
- Tạo tables, indexes, foreign keys
- Insert sample data

**Khi thêm feature mới:**
- Tạo file SQL mới (ví dụ: `courses.sql`)
- Đặt trong `db/init/`
- MySQL sẽ tự động chạy khi container start

---

## 📝 Feature Implementation Pattern

### Khi thêm một feature mới (ví dụ: Courses)

#### 1. Database (`db/init/courses.sql`)
- Tạo tables cần thiết
- Thêm indexes
- Insert sample data (nếu cần)

#### 2. Backend API (`backend/api/public/api/courses/courses.php`)
- Tạo file PHP với CRUD endpoints
- Thêm route vào `index.php`
- Sử dụng helpers (Auth, Response, Database)

#### 3. Frontend Service (`frontend/src/services/courses/courses-api.ts`)
- Tạo service class với methods
- Type-safe với TypeScript interfaces
- Export để sử dụng trong React Query

#### 4. React Query Hooks (`frontend/src/store/server/courses-queries.ts`)
- Tạo queries (GET data)
- Tạo mutations (POST/PUT/DELETE)
- Export từ `store/server/index.ts`

#### 5. Pages (`frontend/src/pages/Courses/`)
- Tạo folder nếu có nhiều pages
- `index.tsx` - List page
- `CourseDetail.tsx` - Detail page
- `CreateCourse.tsx` - Create/Edit page (nếu cần)
- `components/` - Feature-specific components

#### 6. Routes (`frontend/src/routers/routes.tsx`)
- Thêm routes mới
- Wrap với `<ProtectedRoute>` nếu cần

---

## 🎯 Folder Purposes Summary

### Frontend (`frontend/src/`)

| Folder | Mục Đích | Khi Nào Dùng |
|--------|----------|--------------|
| `pages/` | Route-level components | Tạo page mới cho route mới |
| `routers/` | Route configuration | Thêm route, bảo vệ route |
| `services/` | API service layers | Thêm API calls cho feature mới |
| `store/client/` | Client state (Zustand) | UI state, preferences, local state |
| `store/server/` | Server state (React Query) | API queries, mutations |
| `shared/components/` | Reusable components | Component dùng chung nhiều nơi |
| `shared/hooks/` | Reusable hooks | Logic dùng chung nhiều nơi |
| `shared/lib/` | Utilities | Helper functions |
| `styles/` | Global styles | CSS global, variables |

### Backend (`backend/api/`)

| Folder | Mục Đích | Khi Nào Dùng |
|--------|----------|--------------|
| `public/index.php` | Main router | Thêm route cho feature mới |
| `public/api/` | API endpoints | Tạo endpoints cho feature mới |
| `helpers/` | Helper classes | Logic dùng chung (DB, Auth, etc.) |

### Database (`db/init/`)

| File | Mục Đích | Khi Nào Dùng |
|------|----------|--------------|
| `*.sql` | Database schema | Tạo tables cho feature mới |

---

## 🔄 Data Flow Example: Adding a New Feature

### Scenario: Thêm "Courses" feature

**Bước 1: Database**
```
db/init/courses.sql
├── CREATE TABLE courses
├── CREATE TABLE course_enrollments
└── INSERT sample data
```

**Bước 2: Backend API**
```
backend/api/public/api/courses/courses.php
├── GET /api/courses (list)
├── GET /api/courses/:id (detail)
├── POST /api/courses (create - admin/teacher only)
└── POST /api/courses/:id/enroll (enroll - authenticated)
```

**Bước 3: Frontend Service**
```
frontend/src/services/courses/courses-api.ts
├── coursesApi.getCourses()
├── coursesApi.getCourse(id)
├── coursesApi.createCourse(data)
└── coursesApi.enrollCourse(id)
```

**Bước 4: React Query Hooks**
```
frontend/src/store/server/courses-queries.ts
├── useCourses(params)
├── useCourse(id)
├── useCreateCourse()
└── useEnrollCourse()
```

**Bước 5: Pages**
```
frontend/src/pages/Courses/
├── index.tsx (list)
├── CourseDetail.tsx (detail)
├── CourseCreate.tsx (create - protected)
└── components/
    ├── CourseCard.tsx
    └── EnrollmentButton.tsx
```

**Bước 6: Routes**
```
frontend/src/routers/routes.tsx
├── { path: '/courses', element: <Courses /> }
├── { path: '/courses/:id', element: <CourseDetail /> }
└── { path: '/courses/create', element: <ProtectedRoute><CourseCreate /></ProtectedRoute> }
```

---

## 📋 Quick Reference: Where to Put What

### Frontend

| Tôi Muốn... | Đặt Ở Đây |
|-------------|-----------|
| Tạo trang mới | `src/pages/` |
| Tạo route mới | `src/routers/routes.tsx` |
| Gọi API mới | `src/services/[feature]/` |
| Query/mutate data | `src/store/server/[feature]-queries.ts` |
| UI state (modal, sidebar) | `src/store/client/ui-store.ts` |
| Component dùng chung | `src/shared/components/` |
| Hook dùng chung | `src/shared/hooks/` |
| Utility function | `src/shared/lib/utils.ts` |
| Type definitions | `src/shared/types/` hoặc co-locate với file sử dụng |

### Backend

| Tôi Muốn... | Đặt Ở Đây |
|-------------|-----------|
| Tạo API endpoint mới | `backend/api/public/api/[feature]/` |
| Thêm route | `backend/api/public/index.php` |
| Helper function dùng chung | `backend/api/helpers/` |
| Upload files | `backend/storage/` |

### Database

| Tôi Muốn... | Đặt Ở Đây |
|-------------|-----------|
| Tạo tables mới | `db/init/[feature].sql` |
| Seed data | `db/init/[feature].sql` (cùng file) |

---

## 🎨 Component Organization Patterns

### Feature Components vs Shared Components

**Feature Components** (trong `pages/[Feature]/components/`):
- Chỉ dùng trong feature đó
- Ví dụ: `BlogPostCard`, `BlogCommentForm`

**Shared Components** (trong `shared/components/`):
- Dùng ở nhiều features
- Ví dụ: `Button`, `Card`, `Dialog`, `Header`

**Khi nào tạo feature component:**
- Component chỉ dùng trong một feature cụ thể
- Component phụ thuộc vào feature context

**Khi nào tạo shared component:**
- Component có thể dùng ở nhiều features
- Component là UI primitive (Button, Input, etc.)

---

## 🔐 Authentication & Authorization

### Protected Routes Pattern
```
src/routers/routes.tsx
├── Public routes (không cần auth)
├── Protected routes (require auth)
│   └── <ProtectedRoute><Component /></ProtectedRoute>
└── Role-based routes (require specific roles)
    └── <ProtectedRoute requireRoles={['admin']}><Component /></ProtectedRoute>
```

### Backend Permission Checks
```
backend/api/public/api/[feature]/[feature].php
├── Public endpoints (không check auth)
├── Protected endpoints ($auth->requireAuth())
└── Role-based endpoints ($auth->requireRole('admin', 'teacher'))
```

---

## 📦 State Management Pattern

### Client State (`store/client/`)
**Dùng cho:**
- UI state (modals, sidebar, theme)
- Auth status (isAuthenticated, isInitialized)
- User preferences
- Loading overlays

**Files:**
- `auth-store.ts` - Auth state
- `ui-store.ts` - UI state

### Server State (`store/server/`)
**Dùng cho:**
- API data (posts, users, courses)
- Mutations (create, update, delete)
- Caching, refetching, synchronization

**Files:**
- `auth-queries.ts` - Auth queries/mutations
- `blog-queries.ts` - Blog queries/mutations
- `user-queries.ts` - User queries/mutations

**Khi thêm feature mới:**
- Tạo file mới: `[feature]-queries.ts`
- Export từ `store/server/index.ts`

---

## 🛠️ Service Layer Pattern

### API Service (`services/[feature]/`)
**Mục đích:**
- Encapsulate API calls
- Type-safe requests/responses
- Error handling

**Pattern:**
```
services/blog/blog-api.ts
├── blogApi.getPosts(params)
├── blogApi.getPost(id)
├── blogApi.createPost(data)
└── blogApi.updatePost(id, data)
```

**Khi thêm feature:**
1. Tạo folder: `services/[feature]/`
2. Tạo file: `[feature]-api.ts`
3. Define types (interfaces)
4. Export service object

---

## 📄 Page Component Pattern

### Simple Page (single file)
```
pages/Login.tsx
├── Component logic
├── State management (useState, hooks)
└── UI rendering
```

### Feature Page (folder structure)
```
pages/Blog/
├── index.tsx          # Main page (list)
├── PostDetail.tsx     # Detail page
├── CreatePost.tsx     # Create/Edit page
└── components/        # Feature-specific components
    ├── BlogPostCard.tsx
    └── BlogCommentForm.tsx
```

**Khi nào dùng folder structure:**
- Feature có nhiều pages liên quan
- Cần components riêng cho feature
- Cần hooks riêng cho feature

---

## 🔄 API Integration Pattern

### Flow: Frontend → Backend

```
1. Component
   ↓
2. React Query Hook (useXXX)
   ↓
3. Service API (xxxApi.method())
   ↓
4. Base API Client (api.blogRequest())
   ↓
5. Backend PHP Endpoint
   ↓
6. Database Query
   ↓
7. Response → Frontend
```

**Ví dụ cụ thể:**
```
Blog/index.tsx
  ↓ useBlogPosts()
BlogQueries.ts
  ↓ blogApi.getPosts()
BlogAPI.ts
  ↓ api.blogRequest()
ApiClient
  ↓ fetch()
Backend: /api/blog
  ↓ Database query
Response → React Query cache → Component re-render
```

---

## 📚 Best Practices

### 1. File Organization
- ✅ Mỗi feature có folder riêng trong `pages/`
- ✅ Components dùng chung → `shared/`
- ✅ Feature-specific components → `pages/[Feature]/components/`

### 2. Naming Conventions
- ✅ Pages: `PascalCase` (Login.tsx, Blog/index.tsx)
- ✅ Components: `PascalCase` (Button.tsx, BlogPostCard.tsx)
- ✅ Hooks: `camelCase` with `use` prefix (useAuth.tsx, useBlogPosts)
- ✅ Services: `camelCase` (blog-api.ts, auth-api.ts)
- ✅ Stores: `camelCase` with suffix (auth-store.ts, blog-queries.ts)

### 3. Imports
- ✅ Dùng path aliases: `@/shared/components/ui/button`
- ✅ Absolute imports (không dùng relative paths phức tạp)
- ✅ Group imports: React → Third-party → Internal

### 4. State Management
- ✅ Client state → Zustand (`store/client/`)
- ✅ Server state → React Query (`store/server/`)
- ✅ Form state → React Hook Form (local trong component)

### 5. API Calls
- ✅ Luôn dùng React Query hooks (không gọi API trực tiếp)
- ✅ Service layer cho API calls (không gọi fetch() trực tiếp)
- ✅ Type-safe với TypeScript interfaces

---

## 🚀 Adding New Features Checklist

Khi thêm một feature mới, làm theo thứ tự:

- [ ] **1. Database** - Tạo `db/init/[feature].sql`
- [ ] **2. Backend API** - Tạo `backend/api/public/api/[feature]/[feature].php`
- [ ] **3. Add Route** - Thêm route vào `backend/api/public/index.php`
- [ ] **4. Frontend Service** - Tạo `frontend/src/services/[feature]/[feature]-api.ts`
- [ ] **5. React Query Hooks** - Tạo `frontend/src/store/server/[feature]-queries.ts`
- [ ] **6. Export Hooks** - Export từ `frontend/src/store/server/index.ts`
- [ ] **7. Pages** - Tạo `frontend/src/pages/[Feature]/`
- [ ] **8. Components** - Tạo components trong `pages/[Feature]/components/`
- [ ] **9. Routes** - Thêm routes vào `frontend/src/routers/routes.tsx`
- [ ] **10. Test** - Test các flows: create, read, update, delete

---

## 📖 Related Documentation

- [Codebase Guide](./frontend/CODEBASE_GUIDE.md) - Chi tiết về code
- [State Management](./frontend/STATE_MANAGEMENT.md) - State management patterns
- [Routing Guide](./frontend/ROUTING_ARCHITECTURE.md) - Routing patterns
- [Blog Implementation](./BLOG_IMPLEMENTATION.md) - Example feature implementation

---

**Last Updated:** 2024

**Authors:** Development Team

