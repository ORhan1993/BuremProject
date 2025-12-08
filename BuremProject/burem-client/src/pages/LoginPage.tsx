import React from 'react';
import { Button, Card, Space, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined, SolutionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage = () => {
    const navigate = useNavigate();

   const handleLogin = (role: string) => {
    let userData;

    switch(role) {
        case 'test-student':
            userData = { 
                id: 1473, 
                name: 'testtttt test', 
                role: 'student', 
                email: 'orhan.bozgeyik@bogazici.edu.tr', 
                studentNo: '1000100100' 
            };
            break;
        case 'secretary':
            userData = { id: 50, name: 'Zeynep Sekreter', role: 'secretary' };
            break;
        case 'therapist':
            userData = { id: 1, name: 'Dr. Ali Yılmaz', role: 'therapist' };
            break;
        case 'admin':
            userData = { id: 100, name: 'Sistem Yöneticisi', role: 'admin' };
            break;
        default:
            return;
    }

    localStorage.setItem('user', JSON.stringify(userData));
    
    // --- DÜZELTİLEN KISIM BURASI ---
    if (role === 'test-student') {
        navigate('/student/form');
    } 
    else if (role === 'secretary') {
        // ESKİSİ: navigate('/admin', ... ) -> Hatalıydı, admin yetkisi istiyordu.
        navigate('/secretary'); // DOĞRUSU: Doğrudan sekreter paneline
    } 
    else if (role === 'therapist') {
        // ESKİSİ: navigate('/admin', ... ) -> Hatalıydı.
        navigate('/therapist'); // DOĞRUSU: Doğrudan terapist paneline
    } 
    else {
        navigate('/admin');
    }
};

    return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            height: '100vh', background: '#f0f2f5', fontFamily: 'Helvetica, Arial, sans-serif' 
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <div style={{ marginBottom: 30 }}>
                    <div style={{ 
                        width: 60, height: 60, background: '#1e4a8b', borderRadius: '50%', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' 
                    }}>
                        <LockOutlined style={{ fontSize: 30, color: 'white' }} />
                    </div>
                    <Title level={3} style={{ color: '#1e4a8b', margin: 0 }}>BÜREM Giriş</Title>
                    <Text type="secondary">Lütfen giriş yapmak için rolünüzü seçiniz.</Text>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    
                    {/* ÖZEL TEST BUTONU */}
                    <Button 
                        type="primary" 
                        size="large" 
                        block 
                        icon={<UserOutlined />} 
                        onClick={() => handleLogin('test-student')}
                        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', height: 50 }}
                    >
                        Öğrenci Girişi (Test Verisi ile)
                    </Button>

                    <Divider plain>Personel Girişi</Divider>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button block size="large" icon={<SolutionOutlined />} onClick={() => handleLogin('secretary')}>Sekreter</Button>
                        <Button block size="large" icon={<TeamOutlined />} onClick={() => handleLogin('therapist')}>Terapist</Button>
                    </div>
                    
                    <Button type="dashed" block onClick={() => handleLogin('admin')}>Yönetici (Admin)</Button>
                </Space>
            </Card>
        </div>
    );
};

export default LoginPage;