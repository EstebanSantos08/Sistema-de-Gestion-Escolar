import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages — lazy loaded
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const CoursesPage = lazy(() => import('@/pages/admin/CoursesPage'));
const EnrollmentsPage = lazy(() => import('@/pages/admin/EnrollmentsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));

// Teacher
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard'));
const TeacherMyCoursesPage = lazy(() => import('@/pages/teacher/MyCoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/teacher/CourseDetailPage'));
const GradeEntryPage = lazy(() => import('@/pages/teacher/GradeEntryPage'));

// Student
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const StudentMyCoursesPage = lazy(() => import('@/pages/student/MyCoursesPage'));
const MyGradesPage = lazy(() => import('@/pages/student/MyGradesPage'));
const TranscriptPage = lazy(() => import('@/pages/student/TranscriptPage'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Root redirect: sends authenticated users to their dashboard */
function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/docente" replace />;
  return <Navigate to="/estudiante" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root: redirect by role */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── Admin ─────────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/usuarios" element={<UsersPage />} />
            <Route path="/admin/cursos" element={<CoursesPage />} />
            <Route path="/admin/matriculas" element={<EnrollmentsPage />} />
            <Route path="/admin/reportes" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* ── Teacher (+ admin can also access) ─────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
          <Route element={<AppLayout />}>
            <Route path="/docente" element={<TeacherDashboard />} />
            <Route path="/docente/mis-cursos" element={<TeacherMyCoursesPage />} />
            <Route path="/docente/cursos/:courseId" element={<CourseDetailPage />} />
            <Route path="/docente/cursos/:courseId/notas" element={<GradeEntryPage />} />
          </Route>
        </Route>

        {/* ── Student ───────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<AppLayout />}>
            <Route path="/estudiante" element={<StudentDashboard />} />
            <Route path="/estudiante/mis-cursos" element={<StudentMyCoursesPage />} />
            <Route path="/estudiante/mis-notas" element={<MyGradesPage />} />
            <Route path="/estudiante/historial" element={<TranscriptPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: '14px' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
