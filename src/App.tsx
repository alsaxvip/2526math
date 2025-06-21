import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import TeacherLayout from '@/layouts/TeacherLayout';
import StudentLayout from '@/layouts/StudentLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import TeacherDashboard from '@/pages/teacher/Dashboard';
import StudentDashboard from '@/pages/student/Dashboard';
import Classes from '@/pages/teacher/Classes';
import Students from '@/pages/teacher/Students';
import TugasPage from '@/pages/teacher/Tugas';
import NilaiPage from '@/pages/teacher/Nilai';
import PresensiPage from '@/pages/teacher/Presensi';
import JurnalPage from '@/pages/teacher/Jurnal';
import EventsPage from '@/pages/teacher/Events';
import BankSoalPage from '@/pages/teacher/BankSoal';
import GamifikasiPage from '@/pages/teacher/Gamifikasi';
import { initializeSession, hasSessionCredentials, getCurrentUser } from '@/lib/api';

// Protected Route Component with role-based routing
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  // Check if user has active session
  if (!hasSessionCredentials()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = getCurrentUser();
  
  // If allowedRoles is specified, check if user has the right role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'teacher') {
      return <Navigate to="/guru" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/siswa" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return <>{children}</>;
}

function App() {
  // Initialize session on app load - restore from localStorage if available
  useEffect(() => {
    initializeSession();
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <AuthLayout>
          <Login />
        </AuthLayout>
      } />
      
      <Route path="/register" element={
        <AuthLayout>
          <Register />
        </AuthLayout>
      } />
      
      {/* Protected Teacher Routes */}
      <Route path="/guru" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherLayout />
        </ProtectedRoute>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="kelas" element={<Classes />} />
        <Route path="siswa" element={<Students />} />
        <Route path="tugas" element={<TugasPage />} />
        <Route path="nilai" element={<NilaiPage />} />
        <Route path="presensi" element={<PresensiPage />} />
        <Route path="jurnal" element={<JurnalPage />} />
        <Route path="kegiatan" element={<EventsPage />} />
        <Route path="bank-soal" element={<BankSoalPage />} />
        <Route path="gamifikasi" element={<GamifikasiPage />} />
        <Route path="pengaturan" element={<div className="p-6 text-center text-gray-500">Halaman Pengaturan - Coming Soon</div>} />
      </Route>
      
      {/* Protected Student Routes - Only Dashboard */}
      <Route path="/siswa" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App; 