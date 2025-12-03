import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Tag, 
  Avatar, 
  Tabs, 
  Space,
  Divider,
  Alert
} from 'antd';
import { 
  BellOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  BookOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  RightOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// --- STİL NESNELERİ (CSS Yerine) ---
const styles = {
  layout: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa', // Daha yumuşak bir gri
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: '0 24px',
    height: '72px',
    borderBottom: '1px solid #f0f0f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#003eb1',
    color: '#fff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '32px 24px',
  },
  card: {
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: 'none',
    overflow: 'hidden'
  },
  profileCardHeader: {
    background: 'linear-gradient(135deg, #003eb1 0%, #0066ff 100%)',
    padding: '24px',
    color: '#fff',
    borderRadius: '16px 16px 0 0',
    marginBottom: '-16px' // İçeriği yukarı çekmek için
  },
  infoItem: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  applicationCard: {
    marginBottom: '16px',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease'
  },
  sectionTitle: {
    marginBottom: '24px',
    color: '#1f1f1f'
  }
};

// --- TİP TANIMLARI (TypeScript kullanıyorsanız) ---
// Eğer JS kullanıyorsanız bu kısmı silebilirsiniz.
interface Appointment {
  date: string;
  time: string;
  isOnline: boolean;
}

interface Application {
  id: string;
  type: string;
  status: string;
  applicationDate: string;
  lastUpdate: string;
  therapist: string | null;
  nextAppointment: Appointment | null;
}

// --- ANA BİLEŞEN ---
const StudentDashboard = () => {
  // MOCK VERİLER (Backend'den geliyormuş gibi)
  const userData = {
    name: "Ceren Şirin",
    studentNo: "2024106006",
    department: "Kimya Öğretmenliği",
    email: "ceren.sirin@boun.edu.tr",
    phone: "+90 5XX XXX XX XX"
  };

  const applications: Application[] = [
    {
      id: "BSV-2025-001",
      type: "Bireysel Psikolojik Danışmanlık",
      status: "Aktif Süreç",
      applicationDate: "01.11.2025",
      lastUpdate: "20.11.2025",
      therapist: "Rabia Özdemir",
      nextAppointment: {
        date: "20 Kasım 2025",
        time: "10:00",
        isOnline: true
      }
    },
    {
      id: "BSV-2024-089",
      type: "Grup Terapisi (Stres Yönetimi)",
      status: "Tamamlandı",
      applicationDate: "15.05.2024",
      lastUpdate: "30.06.2024",
      therapist: "Ahmet Yılmaz",
      nextAppointment: null
    }
  ];

  const handleLogout = () => {
    console.log("Çıkış yapıldı");
    // navigate('/login');
  };

  // Status Badge Helper
  const getStatusTag = (status: string) => {
    let color = 'default';
    if (status === 'Aktif Süreç') color = 'processing';
    if (status === 'Tamamlandı') color = 'success';
    if (status === 'Beklemede') color = 'warning';
    
    return <Tag color={color} style={{ borderRadius: '12px', padding: '4px 12px', border: 'none' }}>{status}</Tag>;
  };

  return (
    <Layout style={styles.layout}>
      {/* HEADER */}
      <Header style={styles.header}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcon}>B</div>
          <div>
            <Title level={5} style={{ margin: 0, color: '#1f1f1f', lineHeight: 1.2 }}>BÜREM</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>Öğrenci Paneli</Text>
          </div>
        </div>

        <Space size="large">
          <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '20px' }} />} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <Text strong style={{ display: 'block' }}>{userData.name}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>{userData.studentNo}</Text>
            </div>
            <Avatar style={{ backgroundColor: '#e6f7ff', color: '#1890ff', fontWeight: 'bold' }}>
              {userData.name.charAt(0)}
            </Avatar>
            <Button onClick={handleLogout} type="text" icon={<LogoutOutlined />} danger />
          </div>
        </Space>
      </Header>

      {/* CONTENT */}
      <Content style={styles.mainContent}>
        
        {/* KARŞILAMA MESAJI */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Hoş Geldin, {userData.name.split(' ')[0]} 👋</Title>
          <Text type="secondary">Psikolojik danışmanlık süreçlerini ve randevularını buradan yönetebilirsin.</Text>
        </div>

        <Row gutter={[24, 24]}>
          
          {/* SOL KOLON: PROFİL & BİLGİ (8 span) */}
          <Col xs={24} lg={8}>
            <Card style={styles.card} bodyStyle={{ padding: 0 }}>
              <div style={styles.profileCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar size={64} style={{ backgroundColor: '#fff', color: '#003eb1', fontSize: '24px' }}>
                    {userData.name.charAt(0)}
                  </Avatar>
                  <div style={{ color: 'white' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userData.name}</div>
                    <div style={{ opacity: 0.8 }}>{userData.department}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '32px 24px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Title level={5}>Kişisel Bilgiler</Title>
                  <Button type="link" style={{ padding: 0 }}>Düzenle</Button>
                </div>

                <div style={styles.infoItem}>
                  <MailOutlined style={{ fontSize: '18px', color: '#8c8c8c' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>E-Posta</Text>
                    <Text strong>{userData.email}</Text>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <PhoneOutlined style={{ fontSize: '18px', color: '#8c8c8c' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Telefon</Text>
                    <Text strong>{userData.phone}</Text>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <Alert
                    message="Acil Durum?"
                    description="Mesai saatleri dışında acil bir durum yaşıyorsanız lütfen acil durum hattını arayınız."
                    type="info"
                    showIcon
                    style={{ borderRadius: '12px', border: '1px solid #bae7ff', backgroundColor: '#e6f7ff' }}
                    action={
                      <Button size="small" type="primary" ghost>
                        Acil Hat
                      </Button>
                    }
                  />
                </div>
              </div>
            </Card>
          </Col>

          {/* SAĞ KOLON: BAŞVURULAR & RANDEVULAR (16 span) */}
          <Col xs={24} lg={16}>
            <Card style={styles.card}>
              <Tabs defaultActiveKey="1" size="large" tabBarStyle={{ marginBottom: '24px' }}>
                
                {/* TAB 1: BAŞVURULARIM */}
                <Tabs.TabPane tab={<span><BookOutlined /> Başvurularım</span>} key="1">
                  {applications.map((app) => (
                    <div key={app.id} style={styles.applicationCard}>
                      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                        <Col>
                          <Space>
                            <div style={{ backgroundColor: '#e6f7ff', padding: '8px', borderRadius: '8px', color: '#1890ff' }}>
                              <MedicineBoxOutlined style={{ fontSize: '20px' }} />
                            </div>
                            <div>
                              <Text strong style={{ fontSize: '16px', display: 'block' }}>{app.type}</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>Referans: {app.id}</Text>
                            </div>
                          </Space>
                        </Col>
                        <Col>
                          {getStatusTag(app.status)}
                        </Col>
                      </Row>

                      <Divider style={{ margin: '12px 0' }} />

                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Başvuru Tarihi</Text>
                          <Space size={4}><CalendarOutlined /> {app.applicationDate}</Space>
                        </Col>
                        <Col xs={12} sm={8}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Son Güncelleme</Text>
                          <Space size={4}><ClockCircleOutlined /> {app.lastUpdate}</Space>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Atanan Uzman</Text>
                          <Space size={4}><UserOutlined /> {app.therapist || '-'}</Space>
                        </Col>
                      </Row>

                      {app.nextAppointment && (
                        <div style={{ marginTop: '16px', backgroundColor: '#f9f0ff', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Space>
                            {app.nextAppointment.isOnline ? <VideoCameraOutlined style={{ color: '#722ed1' }} /> : <EnvironmentOutlined style={{ color: '#722ed1' }} />}
                            <div>
                              <Text style={{ color: '#722ed1', fontWeight: 'bold', fontSize: '12px' }}>SIRADAKİ RANDEVU</Text>
                              <div style={{ color: '#1f1f1f', fontWeight: 600 }}>
                                {app.nextAppointment.date} - {app.nextAppointment.time}
                              </div>
                            </div>
                          </Space>
                          <Button size="small" type="text" style={{ color: '#722ed1' }}>
                            Detay <RightOutlined style={{ fontSize: '10px' }} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {applications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ccc' }}>
                      <MedicineBoxOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <p>Henüz aktif bir başvurunuz bulunmamaktadır.</p>
                      <Button type="primary">Yeni Başvuru Yap</Button>
                    </div>
                  )}
                </Tabs.TabPane>

                {/* TAB 2: GEÇMİŞ RANDEVULAR */}
                <Tabs.TabPane tab={<span><ClockCircleOutlined /> Randevu Geçmişi</span>} key="2">
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    <p>Geçmiş randevularınız burada listelenecektir.</p>
                  </div>
                </Tabs.TabPane>
                
              </Tabs>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default StudentDashboard;