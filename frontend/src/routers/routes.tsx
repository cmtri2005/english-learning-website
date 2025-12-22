import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/routers/ProtectedRoute';

// ==================== Import Pages ====================

// Public pages
import Index from '@/pages/index';
import Login from '@/pages/Auth/components/Login';
import Register from '@/pages/Auth/components/Register';
import VerifyOtp from '@/pages/Auth/components/VerifyOtp';
import ForgotPassword from '@/pages/Auth/components/ForgotPassword';
import ResetPassword from '@/pages/Auth/components/ResetPassword';
import Logout from '@/pages/Auth/components/Logout';
import Courses from '@/pages/Courses';
import Practice from '@/pages/Practice';
import Blog from '@/pages/Blog';
import { BlogDetail } from '@/pages/Blog/components/BlogDetail';
import { BlogEditor } from '@/pages/Blog/components/BlogEditor';
import Unauthorized from '@/pages/Auth/components/Unauthorized';

// Protected pages (require authentication)
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Profile/Settings';
import Forum from '@/pages/Forum';

// Admin pages (require admin/teacher role)
import AdminDashboard from '@/pages/AdminConsole';
import AdminUsers from '@/pages/AdminConsole/Users';
import AdminModeration from '@/pages/AdminConsole/Moderation';
import { ExamListPage } from "@/pages/Exams/index";
import { ExamDetailPage } from "@/pages/Exams/ExamDetail";
import { ExamTakingPage } from "@/pages/Exams/ExamTaking";
import { ExamResultPage } from "@/pages/Exams/ExamResult";
import { AdminImportExamPage } from "@/pages/AdminConsole/Exams/ImportExam";

// ==================== Route Configuration ====================

export const routes: RouteObject[] = [
  // ===== Public Routes =====
  {
    path: '/',
    element: <Index />,
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/verify-otp', element: <VerifyOtp /> },
  {
    path: '/courses',
    element: <Courses />,
  },
  {
    path: '/practice',
    element: <Practice />,
  },
  {
    path: '/blog',
    element: <Blog />,
  },
  {
    path: '/blog/:slug',
    element: <BlogDetail />,
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
        <BlogEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/blog/edit/:id',
    element: (
      <ProtectedRoute>
        <BlogEditor />
      </ProtectedRoute>
    ),
  },

  // ===== Exam Routes =====
  {
    path: '/exams',
    element: <ExamListPage />,
  },
  {
    path: '/exams/:id',
    element: (
      <ProtectedRoute>
        <ExamDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams/:id/take',
    element: (
      <ProtectedRoute>
        <ExamTakingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams/result/:attemptId',
    element: (
      <ProtectedRoute>
        <ExamResultPage />
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
    path: '/admin/exams/import',
    element: (
      <ProtectedRoute requireRoles={['admin']}>
        <AdminImportExamPage />
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


  // ===== 404 Catch-All =====
  // {
  //   path: '*',
  //   element: <NotFound />,
  // },
];
