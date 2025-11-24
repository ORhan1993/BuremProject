import { useState } from 'react';
import { Form, Input, Button, Card, Layout, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);

    const onFinish = (values: any) => {
        setLoading(true);
        
        // Fake API isteği simülasyonu
        setTimeout(() => {
            const { username, password } = values;

            if (username === 'admin' && password === 'admin') {
                message.success('Yönetici girişi başarılı!');
                localStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'Sistem Yöneticisi' }));
                window.location.href = '/admin'; // Sayfayı yenileyerek yönlendir
            } 
            else if (username === 'ogr.test' && password === '123') {
                message.success('Öğrenci girişi başarılı!');
                localStorage.setItem('user', JSON.stringify({ role: 'student', name: 'Öğrenci Test', studentNo: '202012345' }));
                window.location.href = '/student'; // Sayfayı yenileyerek yönlendir
            } 
            else {
                message.error('Kullanıcı adı veya şifre hatalı!');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ width: 80, height: 80, background: '#003366', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 32, color: 'white', fontWeight: 'bold' }}>B</div>
                    <Title level={2} style={{ color: '#003366', margin: 0 }}>BÜREM</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Öğrenci Kayıt Sistemi</Text>
                </div>

                <Card style={{ width: 400, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} bordered={false}>
                    <Title level={4} style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>Giriş Yap</Title>
                    <Form name="login_form" onFinish={onFinish} size="large" layout="vertical">
                        <Form.Item name="username" rules={[{ required: true, message: 'Kullanıcı adı giriniz!' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Kullanıcı Adı (örn: admin)" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Şifre giriniz!' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Şifre" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#003366' }}>Giriş Yap</Button>
                        </Form.Item>
                    </Form>
                    <div style={{textAlign:'center', marginTop:10, fontSize:12, color:'#999'}}>
                        Admin: admin / admin <br/> Öğrenci: ogr.test / 123
                    </div>
                </Card>
            </Content>
            <Footer style={{ textAlign: 'center', color: '#888' }}>Boğaziçi Üniversitesi ©2025</Footer>
        </Layout>
    );
};

export default LoginPage;