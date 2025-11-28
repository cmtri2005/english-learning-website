import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/routers/ProtectedRoute';

// ==================== Import Pages ====================

// Public pages
import Index from '@/pages/index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Courses from '@/pages/Courses';
import Blog from '@/pages/Blog';
import BlogPostDetail from '@/pages/Blog/PostDetail';
import BlogCreatePost from '@/pages/Blog/CreatePost';
import Unauthorized from '@/pages/Unauthorized';
import NotFound from '@/pages/NotFound';

// Protected pages (require authentication)
import HomeLoggedIn from '@/pages/Dashboard/HomeLoggedIn';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Purchases from '@/pages/Dashboard/Purchases';
import Settings from '@/pages/Profile/Settings';
import Forum from '@/pages/Forum';

// Admin pages (require admin/teacher role)
import AdminDashboard from '@/pages/Admin';
import AdminUsers from '@/pages/Admin/Users';
import AdminCourses from '@/pages/Admin/Courses';
import AdminModeration from '@/pages/Admin/Moderation';
import AdminAnalytics from '@/pages/Admin/Analytics';
import AdminSettings from '@/pages/Admin/Settings';

// ==================== Route Configuration ====================

export const routes: RouteObject[] = [
  // ===== Public Routes =====
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
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
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },

  // ===== Protected Routes (Authentication Required) =====
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomeLoggedIn />
      </ProtectedRoute>
    ),
  },
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
    path: '/purchases',
    element: (
      <ProtectedRoute>
        <Purchases />
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

  // ===== Admin Routes (Admin/Teacher Only) =====
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireRoles={['admin', 'teacher']}>
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
      <ProtectedRoute requireRoles={['admin', 'teacher']}>
        <AdminCourses />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/moderation',
    element: (
      <ProtectedRoute requireRoles={['admin', 'teacher']}>
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
  {
    path: '*',
    element: <NotFound />,
  },
];
