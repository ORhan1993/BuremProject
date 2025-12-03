import { useState } from 'react';
import { Form, Input, Button, Layout, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

// Renk Sabiti
const BOGAZICI_BLUE = '#1B5583';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = (values: any) => {
        setLoading(true);
        
        // Simüle edilmiş giriş (Gerçekte API'ye gidecek)
        setTimeout(() => {
            const { username, password } = values;

            let userData = null;

            // --- ROL TANIMLAMALARI ---
            if (username === 'admin' && password === 'admin') {
                userData = { role: 'admin', name: 'Sistem Yöneticisi' };
            } 
            else if (username === 'ogr' && password === '123') {
                userData = { role: 'student', name: 'Ali Yılmaz', studentNo: '2022001' };
            }
            else if (username === 'terapist' && password === '123') {
                userData = { role: 'therapist', name: 'Dr. Ayşe Kaya' };
            }
            else if (username === 'sekreter' && password === '123') {
                userData = { role: 'secretary', name: 'Fatma Demir' };
            }

            if (userData) {
                message.success(`Hoş geldiniz, ${userData.name}`);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Yönlendirme mantığı
                if (userData.role === 'admin') navigate('/admin');
                else if (userData.role === 'student') {
                     navigate('/student'); // <--- ESKİ KOD (Dashboard'a gidiyordu)
                    //navigate('/evaluation-form'); // <--- YENİ KOD (Test için form sayfasına gider)
                }
                else if (userData.role === 'therapist') navigate('/therapist');
                else if (userData.role === 'secretary') navigate('/secretary');
            } else {
                message.error('Kullanıcı adı veya şifre hatalı!');
            }
            setLoading(false);
        }, 800);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                
                <Card 
                    style={{ width: 420, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }} 
                    styles={{ padding: 40 }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                        <div style={{ 
                            width: 70, height: 70, background: BOGAZICI_BLUE, borderRadius: '50%', 
                            margin: '0 auto 15px', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                            fontSize: 28, color: 'white', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(27, 85, 131, 0.3)' 
                        }}>B</div>
                        <Title level={3} style={{ color: BOGAZICI_BLUE, marginBottom: 5 }}>BÜREM</Title>
                        <Text type="secondary">Öğrenci Kayıt ve Danışmanlık Sistemi</Text>
                    </div>

                    <Form name="login_form" onFinish={onFinish} size="large" layout="vertical">
                        <Form.Item name="username" rules={[{ required: true, message: 'Kullanıcı adı giriniz!' }]}>
                            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Kullanıcı Adı" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Şifre giriniz!' }]}>
                            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Şifre" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} 
                                style={{ background: BOGAZICI_BLUE, borderColor: BOGAZICI_BLUE, height: 45, fontWeight: 500 }}>
                                Giriş Yap
                            </Button>
                        </Form.Item>
                    </Form>
                    
                    <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', borderRadius: 8, fontSize: 12, color: '#666' }}>
                        <strong>Test Hesapları:</strong><br/>
                        Admin: admin / admin<br/>
                        Öğrenci: ogr / 123<br/>
                        Terapist: terapist / 123<br/>
                        Sekreter: sekreter / 123
                    </div>
                </Card>

            </Content>
            <Footer style={{ textAlign: 'center', color: '#999', background: 'transparent' }}>
                Boğaziçi Üniversitesi ©2025
            </Footer>
        </Layout>
    );
};

export default LoginPage;