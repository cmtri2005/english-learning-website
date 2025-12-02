import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/routers/ProtectedRoute';

// ==================== Import Pages ====================

// Public pages
import Index from '@/pages/index';
import Login from '@/pages/Auth/components/Login';
import Register from '@/pages/Auth/components/Register';
import ForgotPassword from '@/pages/Auth/components/ForgotPassword';
import ResetPassword from '@/pages/Auth/components/ResetPassword';
import Logout from '@/pages/Auth/components/Logout';
import Courses from '@/pages/Courses';
import Blog from '@/pages/Blog';
import BlogPostDetail from '@/pages/Blog/PostDetail';
import BlogCreatePost from '@/pages/Blog/CreatePost';
import Unauthorized from '@/pages/Auth/components/Unauthorized';

// Protected pages (require authentication)
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Profile/Settings';
import Forum from '@/pages/Forum';

// Admin pages (require admin/teacher role)
import AdminDashboard from '@/pages/AdminConsole';
import AdminUsers from '@/pages/AdminConsole/Users';
import AdminCourses from '@/pages/AdminConsole/Courses';
import AdminModeration from '@/pages/AdminConsole/Moderation';
import AdminAnalytics from '@/pages/AdminConsole/Analytics';
import AdminSettings from '@/pages/AdminConsole/Settings';

// ==================== Route Configuration ====================

export const routes: RouteObject[] = [
  // ===== Public Routes =====
  {
    path: '/',
    element: <Index />,
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/courses',
    element: <Courses />,
  },
  {
    path: '/blog',
    element: <Blog />,
  },
  {
    path: '/blog/:slug',
    element: <BlogPostDetail />,
  },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // ===== Protected Routes (Authentication Required) =====
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/logout',
    element: (
      <ProtectedRoute>
        <Logout />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forum',
    element: (
      <ProtectedRoute>
        <Forum />
      </ProtectedRoute>
    ),
  },
  {
    path: '/blog/create',
    element: (
      <ProtectedRoute>
        <BlogCreatePost />
      </ProtectedRoute>
    ),
  },
  {
    path: '/blog/edit/:id',
    element: (
      <ProtectedRoute>
        <BlogCreatePost />
      </ProtectedRoute>
    ),
  },

  // ===== Admin Routes (Admin Only) =====
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminUsers />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/courses',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminCourses />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/moderation',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminModeration />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminSettings />
      </ProtectedRoute>
    ),
  },

  // ===== 404 Catch-All =====
  // {
  //   path: '*',
  //   element: <NotFound />,
  // },
];
