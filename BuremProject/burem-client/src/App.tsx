import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentForm from './pages/StudentForm';
import AdminPanel from './pages/admin/AdminPanel';
import StudentSearchPage from './pages/StudentSearchPage';
import StudentDetailPage from './pages/StudentDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';

// --- KORUMALI ROTA (Yetkisiz girişleri engeller) ---
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    return children;
};

// --- KÖK YÖNLENDİRİCİ (Login mi Panel mi?) ---
const RootRedirect = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        // Kullanıcı yoksa direkt Login'i göster
        return <LoginPage />;
    }

    // Kullanıcı varsa rolüne göre yönlendir
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    
    // Rolü bilinmiyorsa yine Login göster
    return <LoginPage />;
};

function App() {
  return (
    // DİKKAT: Burada <BrowserRouter> YOK! Çünkü main.tsx'te var.
    <Routes>
        {/* 1. Ana Sayfa (Karar Mekanizması) */}
        <Route path="/" element={<RootRedirect />} />

        {/* 2. Öğrenci Formu */}
        <Route 
            path="/student" 
            element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentForm />
                </ProtectedRoute>
            } 
        />

        {/* 3. Admin Panelleri */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/search" element={<ProtectedRoute allowedRoles={['admin']}><StudentSearchPage /></ProtectedRoute>} />
        <Route path="/admin/student/:id" element={<ProtectedRoute allowedRoles={['admin']}><StudentDetailPage /></ProtectedRoute>} />
        <Route path="/admin/session/view/:id" element={<ProtectedRoute allowedRoles={['admin']}><SessionDetailPage /></ProtectedRoute>} />
        <Route path="/admin/session/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><SessionDetailPage /></ProtectedRoute>} />

        {/* Hatalı Link */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;