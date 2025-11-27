# 📚 Hướng Dẫn Tech Stack & Luồng Hoạt Động Frontend

Tài liệu này giải thích chi tiết về các công nghệ được sử dụng và cách ứng dụng hoạt động từ đầu đến cuối.

---

## 🛠️ Tech Stack (Công Nghệ Sử Dụng)

### **Core Framework & Language**
- **React 18.3.1** - Thư viện JavaScript để xây dựng giao diện người dùng
- **TypeScript 5.9.2** - JavaScript với type checking, giúp code an toàn hơn
- **Vite 7.1.2** - Build tool nhanh, thay thế cho Webpack

### **Routing & Navigation**
- **React Router DOM 6.30.1** - Quản lý routing (điều hướng giữa các trang)
  - `BrowserRouter` - Router chính
  - `Routes`, `Route` - Định nghĩa routes
  - `Link`, `Navigate` - Điều hướng

### **State Management (Quản Lý Trạng Thái)**

#### **1. Server State (Dữ Liệu Từ API)**
- **TanStack React Query 5.84.2** - Quản lý dữ liệu từ server
  - Tự động cache, refetch, error handling
  - Queries: Lấy dữ liệu (GET)
  - Mutations: Thay đổi dữ liệu (POST, PUT, DELETE)

#### **2. Client State (Trạng Thái UI)**
- **Zustand 5.0.8** - Quản lý state đơn giản, nhẹ
  - Dùng cho: auth status, UI state (modals, sidebar)

### **UI & Styling**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Component library không style (headless)
  - Cung cấp: Dialog, Dropdown, Toast, Tooltip, etc.
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **shadcn/ui** - Component system (built on Radix + Tailwind)

### **Form Handling**
- **React Hook Form 7.62.0** - Quản lý form hiệu quả
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - Kết nối Zod với React Hook Form

### **HTTP Client**
- **Fetch API** (native) - Gọi API, không cần thư viện thêm
- Custom `ApiClient` class - Wrapper cho fetch với:
  - Token management
  - Error handling
  - Response typing

### **Build & Development Tools**
- **Vite** - Dev server, build tool
- **SWC** - Compiler nhanh (thay thế Babel)
- **PostCSS** - CSS processing
- **Autoprefixer** - Tự động thêm vendor prefixes

---

## 📁 Cấu Trúc Thư Mục

```
frontend/
├── src/
│   ├── main.tsx              # Entry point - Khởi động app
│   ├── pages/                # Các trang (routes)
│   │   ├── index.tsx         # Trang chủ
│   │   ├── Login.tsx         # Trang đăng nhập
│   │   ├── Blog/             # Feature Blog
│   │   └── Admin/            # Feature Admin
│   ├── routers/              # Cấu hình routing
│   │   ├── routes.tsx        # Định nghĩa tất cả routes
│   │   └── ProtectedRoute.tsx # Bảo vệ routes cần auth
│   ├── services/             # API service layer
│   │   ├── http/
│   │   │   └── api.ts        # Base API client
│   │   └── blog/
│   │       └── blog-api.ts   # Blog API methods
│   ├── store/                # State management
│   │   ├── client/           # Client state (Zustand)
│   │   │   └── auth-store.ts
│   │   ├── server/           # Server state (React Query)
│   │   │   ├── auth-queries.ts
│   │   │   └── blog-queries.ts
│   │   └── config/
│   │       └── query-client.ts
│   ├── shared/               # Code dùng chung
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilities
│   └── styles/
│       └── global.css        # Global styles
├── public/                   # Static files
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.ts        # Tailwind configuration
```

---

## 🔄 Luồng Hoạt Động (Application Flow)

### **1. Khởi Động Ứng Dụng (App Startup)**

```
index.html
  ↓
main.tsx (Entry Point)
  ↓
App Component
  ↓
Providers Setup:
  ├── QueryClientProvider (React Query)
  ├── AuthInitializer (Load user nếu có token)
  ├── TooltipProvider (UI)
  ├── Toaster (Notifications)
  └── BrowserRouter (Routing)
  ↓
Routes Configuration
  ↓
Render Page Component
```

**Chi tiết:**

1. **`index.html`** - File HTML gốc, có `<div id="root">` để React render vào
2. **`main.tsx`** - Entry point:
   ```tsx
   createRoot(document.getElementById("root")!).render(<App />);
   ```
3. **`App` Component** - Setup các Providers:
   - `QueryClientProvider` - Cung cấp React Query cho toàn app
   - `AuthInitializer` - Tự động load user nếu có token trong localStorage
   - `BrowserRouter` - Bật routing
   - `Routes` - Render component tương ứng với URL

### **2. Routing (Điều Hướng)**

```
User clicks link / types URL
  ↓
React Router checks routes.tsx
  ↓
Match route path
  ↓
Check if ProtectedRoute?
  ├── YES → Check authentication
  │   ├── Not logged in → Redirect to /login
  │   ├── Wrong role → Redirect to /unauthorized
  │   └── OK → Render component
  └── NO → Render component directly
```

**Ví dụ:**

- User vào `/blog` → Public route → Render `<Blog />` ngay
- User vào `/dashboard` → Protected route → Check auth → Render `<Dashboard />`
- User vào `/admin` → Protected + Role → Check auth + role → Render `<AdminDashboard />`

### **3. Data Flow (Luồng Dữ Liệu)**

#### **A. Lấy Dữ Liệu (GET Data)**

```
Component (Page)
  ↓
useBlogPosts() hook (React Query)
  ↓
blogApi.getPosts() (Service Layer)
  ↓
api.blogRequest() (Base API Client)
  ↓
fetch() → Backend API
  ↓
Response → React Query Cache
  ↓
Component re-render với data
```

**Ví dụ cụ thể:**

```tsx
// 1. Component sử dụng hook
function Blog() {
  const { data, isLoading, error } = useBlogPosts();
  // ...
}

// 2. Hook gọi service
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog', 'posts'],
    queryFn: () => blogApi.getPosts(), // Service layer
  });
}

// 3. Service gọi API
export const blogApi = {
  async getPosts() {
    return api.blogRequest('/api/blog', { method: 'GET' });
  }
}

// 4. Base client thực hiện fetch
class ApiClient {
  async request(endpoint) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    return response.json();
  }
}
```

#### **B. Thay Đổi Dữ Liệu (POST/PUT/DELETE)**

```
User action (click button, submit form)
  ↓
Component calls mutation hook
  ↓
useCreateBlogPost() (React Query Mutation)
  ↓
blogApi.createPost(data) (Service)
  ↓
api.blogRequest() (Base Client)
  ↓
fetch() → Backend API
  ↓
Success → Invalidate cache → Refetch queries
  ↓
Component re-render với data mới
```

**Ví dụ:**

```tsx
// Component
const createPost = useCreateBlogPost();

const handleSubmit = async (data) => {
  await createPost.mutateAsync(data);
  // React Query tự động invalidate cache và refetch
};

// Hook
export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => blogApi.createPost(data),
    onSuccess: () => {
      // Tự động refetch danh sách posts
      queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
  });
}
```

### **4. Authentication Flow (Luồng Xác Thực)**

```
App Start
  ↓
AuthInitializer component mounts
  ↓
useCurrentUser() hook runs
  ↓
Check: localStorage có token?
  ├── YES → Call API /api/auth/me
  │   ├── Success → Set user in Zustand store
  │   └── Fail → Clear token, redirect to login
  └── NO → Do nothing
  ↓
User state synced to Zustand store
  ↓
ProtectedRoute checks useAuth()
  ↓
Allow/Deny access
```

**Chi tiết:**

1. **App khởi động** → `AuthInitializer` component chạy
2. **`useCurrentUser()`** hook:
   - Check `localStorage.getItem('token')`
   - Nếu có → Gọi API `/api/auth/me` để lấy user info
   - Sync user vào Zustand store
3. **Protected routes** dùng `useAuth()` để check:
   - `isLoggedIn` - User đã đăng nhập chưa?
   - `user` - Thông tin user
   - `isLoading` - Đang load không?

### **5. State Management (Quản Lý Trạng Thái)**

#### **Server State (React Query)**
- **Dùng cho:** Dữ liệu từ API (posts, users, courses)
- **Tự động:**
  - Cache data
  - Refetch khi cần
  - Error handling
  - Loading states

```tsx
// Query - Lấy dữ liệu
const { data, isLoading, error } = useBlogPosts();

// Mutation - Thay đổi dữ liệu
const createPost = useCreateBlogPost();
createPost.mutate({ title: '...', content: '...' });
```

#### **Client State (Zustand)**
- **Dùng cho:** UI state, auth status
- **Ví dụ:**
  - `isAuthenticated` - Đã login chưa?
  - `isSidebarOpen` - Sidebar đang mở?
  - `theme` - Dark/Light mode

```tsx
// Store
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// Sử dụng
const { user, isAuthenticated } = useAuthStore();
```

---

## 🎯 Ví Dụ Thực Tế: User Đọc Blog Post

### **Scenario: User click vào một blog post**

```
1. User clicks link: /blog/my-post-slug
   ↓
2. React Router matches route: /blog/:slug
   ↓
3. Render BlogPostDetail component
   ↓
4. Component calls: useBlogPost('my-post-slug')
   ↓
5. React Query checks cache:
   ├── Có trong cache? → Return cached data
   └── Chưa có? → Gọi API
   ↓
6. blogApi.getPost('my-post-slug')
   ↓
7. api.blogRequest('/api/blog/my-post-slug')
   ↓
8. fetch('http://localhost:8000/api/blog/my-post-slug')
   ↓
9. Backend returns post data
   ↓
10. React Query caches data
   ↓
11. Component re-renders với post data
   ↓
12. User thấy blog post content
```

### **Nếu user like post:**

```
1. User clicks Like button
   ↓
2. Component calls: toggleLike.mutate(postId)
   ↓
3. useToggleBlogLike() mutation
   ↓
4. blogApi.toggleLike(postId)
   ↓
5. POST /api/blog/{id}/like
   ↓
6. Backend updates like count
   ↓
7. React Query updates cache:
   - Update post in cache
   - Update post in list cache
   ↓
8. Component re-renders với like count mới
   ↓
9. UI hiển thị số like đã tăng
```

---

## 🔑 Key Concepts (Khái Niệm Quan Trọng)

### **1. Component Lifecycle**
- **Mount** - Component được render lần đầu
- **Update** - Component re-render khi state/props thay đổi
- **Unmount** - Component bị xóa khỏi DOM

### **2. React Query Concepts**
- **Query** - Lấy dữ liệu (GET)
- **Mutation** - Thay đổi dữ liệu (POST/PUT/DELETE)
- **Cache** - Lưu trữ dữ liệu đã fetch
- **Stale** - Dữ liệu cũ, cần refetch
- **Invalidate** - Đánh dấu cache không còn hợp lệ

### **3. Routing Concepts**
- **Route** - Đường dẫn URL và component tương ứng
- **Protected Route** - Route cần authentication
- **Navigate** - Chuyển trang programmatically
- **Link** - Component để điều hướng

### **4. State Management Concepts**
- **Server State** - Dữ liệu từ API (React Query)
- **Client State** - Trạng thái UI (Zustand)
- **Local State** - State trong component (useState)

---

## 🚀 Development Workflow

### **1. Chạy Development Server**
```bash
cd frontend
pnpm install  # Cài dependencies (chỉ cần chạy 1 lần)
pnpm dev      # Chạy dev server
```

### **2. Build Production**
```bash
pnpm build    # Build ra thư mục dist/
```

### **3. Type Checking**
```bash
pnpm typecheck  # Kiểm tra TypeScript errors
```

---

## 📝 Tóm Tắt

### **Tech Stack:**
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Server state
- **Zustand** - Client state
- **Tailwind + Radix** - UI components

### **Luồng Hoạt Động:**
1. **App start** → Setup providers → Load routes
2. **User navigation** → Router matches → Check auth → Render page
3. **Data fetching** → Component → Hook → Service → API → Cache → Render
4. **State management** → Server state (React Query) + Client state (Zustand)

### **Best Practices:**
- ✅ Dùng React Query cho API data
- ✅ Dùng Zustand cho UI state
- ✅ Tách service layer riêng
- ✅ Type-safe với TypeScript
- ✅ Protected routes với authentication
- ✅ Component reusability

---

**Tài liệu này giúp bạn hiểu cách frontend hoạt động từ đầu đến cuối!** 🎉

