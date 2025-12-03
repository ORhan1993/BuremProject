import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentForm from './pages/StudentForm';
import StudentDashboard from './pages/StudentDashboard';
import EvaluationForm from './pages/EvaluationForm'; 
import GroupStudiesPage from './pages/terapist/GroupStudiesPage';
import AdminPanel from './pages/admin/AdminPanel';
import SecretariesPage from './pages/admin/SecretariesPage';
import StudentSearchPage from './pages/StudentSearchPage';
import StudentDetailPage from './pages/StudentDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SecretaryDashboard from './pages/SecretaryDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import MainLayout from './layouts/MainLayout';


// --- KORUMALI ROTA BİLEŞENİ ---
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        // Kullanıcı yoksa veya rolü yetersizse Login'e at
        if (!user || !allowedRoles.includes(user.role)) {
            return <Navigate to="/login" replace />;
        }
        return children;
    } catch (error) {
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }
};

// --- KÖK DİZİN YÖNLENDİRİCİSİ ---
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
            
            {/* ÖĞRENCİ ROTALARI */}
            <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                </ProtectedRoute>
            } />
            <Route path="/student/basvuru" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentForm />
                </ProtectedRoute>
            } />
               {/* --- DEĞERLENDİRME FORMU ROTASI GÜNCELLENDİ --- */}
            
            
            <Route path="/degerlendirme-formu" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <EvaluationForm />
                </ProtectedRoute>
            } />
            

            {/* YENİ KOD: Login sayfasındaki yönlendirme ile eşleşiyor 
            <Route path="/evaluation-form" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <EvaluationForm />
                </ProtectedRoute>
            } />

            */}

            {/* ADMİN ROTALARI */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                </ProtectedRoute>
            } />
            
            {/* SEKRETER YÖNETİMİ */}
            <Route path="/admin/secretaries" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <SecretariesPage />
                </ProtectedRoute>
            } />

            {/* ARAMA VE DETAY SAYFALARI */}
            <Route path="/admin/search" element={
                <ProtectedRoute allowedRoles={['admin', 'secretary']}>
                    <StudentSearchPage />
                </ProtectedRoute>
            } />
            
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

            {/* TERAPİST VE SEKRETER PANELLERİ */}
            <Route path="/therapist" element={
                <ProtectedRoute allowedRoles={['therapist']}>
                    <TherapistDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/secretary" element={
                <ProtectedRoute allowedRoles={['secretary']}>
                    <SecretaryDashboard />
                </ProtectedRoute>
            } />
        </Route>

        {/* 4. HATALI URL YAKALAMA */}
        <Route path="*" element={<Navigate to="/login" replace />} />

        <Route path="/therapist/groups" element={<GroupStudiesPage />} />
    </Routes>
  );
}

export default App;