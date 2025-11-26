import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentForm from './pages/StudentForm';
import AdminPanel from './pages/admin/AdminPanel';
import SecretariesPage from './pages/admin/SecretariesPage'; // Yeni sayfa
import StudentSearchPage from './pages/StudentSearchPage';
import StudentDetailPage from './pages/StudentDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';
import MainLayout from './layouts/MainLayout';

// Geçici sayfa
const ComingSoon = ({ title }: { title: string }) => (
    <div style={{ textAlign: 'center', padding: 50 }}>
        <h2>{title}</h2>
        <p>Bu sayfa yapım aşamasındadır.</p>
    </div>
);

// --- KORUMALI ROTA ---
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || !allowedRoles.includes(user.role)) {
            return <Navigate to="/login" replace />;
        }
        return children;
    } catch (error) {
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }
};

// --- ANA YÖNLENDİRİCİ ---
const RootRedirect = () => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user) return <Navigate to="/login" replace />;

        // Rol bazlı yönlendirme
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'student') return <Navigate to="/student" replace />;
        if (user.role === 'secretary') return <Navigate to="/secretary" replace />;
        if (user.role === 'therapist') return <Navigate to="/therapist" replace />;
        
        return <Navigate to="/login" replace />;
    } catch (error) {
        return <Navigate to="/login" replace />;
    }
};

function App() {
  return (
    <Routes>
        {/* 1. GİRİŞ SAYFASI (Layout Dışında) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. KÖK DİZİN YÖNLENDİRMESİ */}
        <Route path="/" element={<RootRedirect />} />

        {/* 3. PANEL İÇERİK ROTALARI (Navbar/Sidebar Dahil) */}
        <Route element={<MainLayout />}>
            
            {/* ÖĞRENCİ */}
            <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentForm />
                </ProtectedRoute>
            } />

            {/* ADMİN */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                </ProtectedRoute>
            } />
            
            {/* ÖĞRENCİ ARAMA (Admin ve Sekreter için) */}
            <Route path="/admin/search" element={
                <ProtectedRoute allowedRoles={['admin', 'secretary']}>
                    <StudentSearchPage />
                </ProtectedRoute>
            } />

            {/* SEKRETER YÖNETİMİ (Sadece Admin) */}
            <Route path="/admin/secretaries" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <SecretariesPage />
                </ProtectedRoute>
            } />

            {/* DETAY SAYFALARI */}
            <Route path="/admin/student/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'secretary', 'therapist']}>
                    <StudentDetailPage />
                </ProtectedRoute>
            } />
            
            <Route path="/admin/session/view/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'therapist']}>
                    <SessionDetailPage />
                </ProtectedRoute>
            } />

            {/* DİĞER ROLLER */}
            <Route path="/therapist" element={
                <ProtectedRoute allowedRoles={['therapist']}>
                    <ComingSoon title="Terapist Paneli" />
                </ProtectedRoute>
            } />
            
            <Route path="/secretary" element={
                <ProtectedRoute allowedRoles={['secretary']}>
                    <ComingSoon title="Sekreter Paneli" />
                </ProtectedRoute>
            } />
        </Route>

        {/* 4. HATALI URL YAKALAMA */}
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;