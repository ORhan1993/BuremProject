import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentForm from './pages/StudentForm';
import AdminPanel from './pages/admin/AdminPanel';
import StudentSearchPage from './pages/StudentSearchPage';
import StudentDetailPage from './pages/StudentDetailPage';
import SessionDetailPage from './pages/SessionDetailPage';

// --- KORUMALI ROTA ---
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || !allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
        return children;
    } catch (error) {
        localStorage.removeItem('user');
        return <Navigate to="/" replace />;
    }
};

// --- KÖK YÖNLENDİRİCİ ---
const RootRedirect = () => {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user) return <LoginPage />;

        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'student') return <Navigate to="/student" replace />;
        
        return <LoginPage />;
    } catch (error) {
        localStorage.removeItem('user');
        return <LoginPage />;
    }
};

function App() {
  return (
    <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentForm /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/search" element={<ProtectedRoute allowedRoles={['admin']}><StudentSearchPage /></ProtectedRoute>} />
        <Route path="/admin/student/:id" element={<ProtectedRoute allowedRoles={['admin']}><StudentDetailPage /></ProtectedRoute>} />
        <Route path="/admin/session/view/:id" element={<ProtectedRoute allowedRoles={['admin']}><SessionDetailPage /></ProtectedRoute>} />
        <Route path="/admin/session/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><SessionDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;