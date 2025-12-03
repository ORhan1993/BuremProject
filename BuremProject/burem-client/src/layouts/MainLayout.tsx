import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, theme, Typography, Badge, Popover, List, Button, Divider } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    LogoutOutlined, UserOutlined, HomeOutlined, TeamOutlined, // TeamOutlined eklendi
    FileSearchOutlined, SolutionOutlined, BellOutlined,
    CheckCircleOutlined, InfoCircleOutlined, SettingOutlined, DownOutlined,
    QuestionCircleOutlined, PhoneOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// --- BOĞAZİÇİ ÜNİVERSİTESİ KURUMSAL KİMLİK RENKLERİ ---
const BOUN_BLUE = '#1e4a8b'; // Lacivert (Elektronik Ortam)
const BOUN_LIGHT_BLUE = '#8cc8ea'; // Mavi (Elektronik Ortam)
const BOUN_FONT = 'Helvetica, Arial, sans-serif'; // Kurumsal Font

// Arka planlar için kurumsal rengin çok açık tonu
const LIGHT_BG = '#f4f8fc'; 

// Mock Bildirimler
const notifications = [
    { id: 1, title: 'Yeni öğrenci başvurusu (Ahmet Y.)', time: '10 dk önce', type: 'info' },
    { id: 2, title: 'Randevu hatırlatması: 14:00', time: '1 saat önce', type: 'warning' },
    { id: 3, title: 'Sistem bakımı tamamlandı', time: 'Dün', type: 'success' },
];

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    const { token: { colorBgContainer, borderRadiusLG, boxShadowSecondary } } = theme.useToken();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            // Varsayılan olarak admin, test için
            setUser({ name: 'Admin Kullanıcı', role: 'admin' });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getMenuItems = () => {
        const role = user?.role?.toLowerCase(); // Rol kontrolünü güvenli hale getirelim
        const items = [];
        
        // 1. Ana Sayfa (Herkes görür)
        items.push({ 
            key: '/', 
            icon: <HomeOutlined />, 
            label: <Link to="/">Ana Sayfa</Link>,
            style: { fontSize: '14px', fontWeight: 500, fontFamily: BOUN_FONT }
        });

        // 2. Grup Çalışmaları (Terapist ve Admin görür) - YENİ EKLENDİ
        if (role === 'admin' || role === 'therapist' || role === 'terapist') {
            items.push({ 
                key: '/therapist/groups', 
                icon: <TeamOutlined />, 
                label: <Link to="/therapist/groups">Grup Çalışmaları</Link>,
                style: { fontSize: '14px', fontWeight: 500, fontFamily: BOUN_FONT }
            });
        }

        // 3. Yönetim Menüleri (Sadece Admin)
        if (role === 'admin') {
            items.push(
                { 
                    key: '/admin', 
                    icon: <SettingOutlined />, 
                    label: <Link to="/admin">Yönetim Paneli</Link>,
                    style: { fontSize: '14px', fontWeight: 500, fontFamily: BOUN_FONT }
                },
                { 
                    key: 'search-link', 
                    icon: <FileSearchOutlined />, 
                    label: <Link to="/admin" state={{ targetTab: 'search' }}>Öğrenci Ara</Link>,
                    style: { fontSize: '14px', fontWeight: 500, fontFamily: BOUN_FONT }
                },
                { 
                    key: 'secretaries-link', 
                    icon: <SolutionOutlined />, 
                    label: <Link to="/admin" state={{ targetTab: '4' }}>Sekreter İşlemleri</Link>,
                    style: { fontSize: '14px', fontWeight: 500, fontFamily: BOUN_FONT }
                }
            );
        }
        return items;
    };

    const notificationContent = (
        <div style={{ width: 320, fontFamily: BOUN_FONT }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                <Text strong style={{ color: BOUN_BLUE, fontFamily: BOUN_FONT }}>Bildirimler</Text>
                <Link to="/notifications" style={{ fontSize: 12, fontFamily: BOUN_FONT, color: BOUN_BLUE }}>Tümünü Gör</Link>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={(item) => (
                    <List.Item style={{ padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <List.Item.Meta
                            avatar={item.type === 'success' ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : <InfoCircleOutlined style={{ color: BOUN_BLUE, fontSize: 18 }} />}
                            title={<Text style={{ fontSize: 13, fontWeight: 500, fontFamily: BOUN_FONT }}>{item.title}</Text>}
                            description={<Text type="secondary" style={{ fontSize: 11, fontFamily: BOUN_FONT }}>{item.time}</Text>}
                        />
                    </List.Item>
                )}
            />
        </div>
    );

    const userMenu = {
        items: [
            { key: 'info', label: <div style={{padding:'4px 0', fontFamily: BOUN_FONT}}><Text strong>{user?.name}</Text><br/><Text type="secondary" style={{fontSize:11}}>{user?.role?.toUpperCase()}</Text></div>, disabled: true },
            { type: 'divider' as const },
            { key: 'profile', label: 'Profil Ayarları', icon: <UserOutlined />, style: {fontFamily: BOUN_FONT} },
            { key: 'help', label: 'Yardım', icon: <QuestionCircleOutlined />, style: {fontFamily: BOUN_FONT} },
            { type: 'divider' as const },
            { key: 'logout', label: 'Güvenli Çıkış', icon: <LogoutOutlined />, onClick: handleLogout, danger: true, style: {fontFamily: BOUN_FONT} }
        ]
    };

    return (
        <Layout style={{ minHeight: '100vh', background: LIGHT_BG, fontFamily: BOUN_FONT }}>
            
            {/* --- HEADER (Kurumsal Lacivert) --- */}
            <Header style={{ 
                background: BOUN_BLUE, //
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 32px',
                height: 72,
                boxShadow: '0 2px 10px rgba(30, 74, 139, 0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%'
            }}>
                {/* Logo Bölümü - Kılavuza Uygun Stil */}
                <div 
                    className="logo-area" 
                    style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, cursor:'pointer' }} 
                    onClick={() => navigate('/')}
                >
                    {/* Logo Beyaz Dairesi ve Renkleri */}
                    <div style={{ 
                        width: 44, height: 44, 
                        background: '#fff', // Beyaz zemin zorunluluğu
                        color: BOUN_BLUE, 
                        borderRadius: '50%', // Daire formunda
                        fontWeight: 'bold', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        fontSize: 24,
                        fontFamily: 'Helvetica, sans-serif',
                        border: `2px solid ${BOUN_BLUE}` // İsteğe bağlı çerçeve estetiği
                    }}>
                        B
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px', fontFamily: BOUN_FONT }}>BÜREM</span>
                        <span style={{ color: BOUN_LIGHT_BLUE, fontSize: '0.75rem', fontWeight: 400, fontFamily: BOUN_FONT }}>Psikolojik Danışmanlık</span>
                    </div>
                </div>

                {/* Ana Menü */}
                <div style={{ flex: 1, marginLeft: 40 }}>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        items={getMenuItems()}
                        style={{ 
                            background: 'transparent', 
                            borderBottom: 'none', 
                            width: '100%',
                            fontFamily: BOUN_FONT
                        }}
                    />
                </div>

                {/* Sağ Taraf */}
                <Space size={20}>
                    <Popover content={notificationContent} trigger="click" placement="bottomRight" styles={{ padding: 0 }} arrow={false}>
                        <Badge count={3} offset={[-2, 2]} size="small" color={BOUN_LIGHT_BLUE}>
                            <Button 
                                type="text" 
                                shape="circle" 
                                icon={<BellOutlined style={{ fontSize: 20, color: 'white' }} />} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: 'none' }} 
                            />
                        </Badge>
                    </Popover>

                    <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                        <Space style={{ 
                            cursor: 'pointer', 
                            padding: '6px 12px', 
                            borderRadius: 30, 
                            background: 'rgba(255,255,255,0.1)', 
                            transition: 'all 0.3s',
                            border: `1px solid ${BOUN_LIGHT_BLUE}`
                        }}>
                            <Avatar style={{ backgroundColor: '#fff', color: BOUN_BLUE, verticalAlign: 'middle' }} icon={<UserOutlined />} size="small" />
                            <Text style={{ color: 'white', fontWeight: 500, fontSize: 13, marginLeft: 6, fontFamily: BOUN_FONT }} className="hide-on-mobile">{user?.name?.split(' ')[0] || 'Hesabım'}</Text>
                            <DownOutlined style={{ color: BOUN_LIGHT_BLUE, fontSize: 10, marginLeft: 2 }} />
                        </Space>
                    </Dropdown>
                </Space>
            </Header>

            {/* --- CONTENT --- */}
            <Content style={{ 
                padding: isAdminRoute ? 0 : '32px 40px', 
                width: '100%', 
                maxWidth: isAdminRoute ? '100%' : 1500, 
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
                fontFamily: BOUN_FONT
            }}>
                <div style={{
                    background: isAdminRoute ? 'transparent' : colorBgContainer,
                    minHeight: '80vh',
                    padding: isAdminRoute ? 0 : 40,
                    borderRadius: isAdminRoute ? 0 : 12,
                    boxShadow: isAdminRoute ? 'none' : boxShadowSecondary,
                    position: 'relative',
                    overflow: isAdminRoute ? 'hidden' : 'visible'
                }}>
                    <Outlet />
                </div>
            </Content>

            {/* --- FOOTER (Kurumsal Lacivert) --- */}
            {!isAdminRoute && (
                <Footer style={{ 
                    background: BOUN_BLUE, //
                    color: 'rgba(255,255,255,0.8)', 
                    padding: '30px 50px', 
                    fontSize: '13px',
                    fontFamily: BOUN_FONT,
                    borderTop: `4px solid ${BOUN_LIGHT_BLUE}` // Aksan Rengi
                }}>
                    <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <Text strong style={{ color: 'white', fontSize: 16, display:'block', marginBottom: 5, fontFamily: BOUN_FONT }}>BÜREM</Text>
                            <div>Boğaziçi Üniversitesi Rehberlik ve Psikolojik Danışmanlık Merkezi</div>
                            <div style={{marginTop: 5, fontSize: 12, opacity: 0.7, color: BOUN_LIGHT_BLUE}}>1863'ten beri</div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: 10 }}>© 2025 Tüm Hakları Saklıdır.</div>
                            <Space split={<Divider type="vertical" style={{ borderColor: BOUN_LIGHT_BLUE }} />}>
                                <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.7)' }}>Gizlilik Politikası</Link>
                                <Link to="/contact" style={{ color: 'rgba(255,255,255,0.7)' }}>İletişim</Link>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}><PhoneOutlined /> +90 212 359 6609</span>
                            </Space>
                        </div>
                    </div>
                </Footer>
            )}
        </Layout>
    );
};

export default MainLayout;