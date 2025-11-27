import React, { useState } from 'react';
import { 
    Layout, Card, Typography, Timeline, Tag, Button, Alert, 
    Descriptions, Badge, Row, Col, Space, Divider 
} from 'antd';
import { 
    ClockCircleOutlined, VideoCameraOutlined, EnvironmentOutlined, 
    CheckCircleOutlined, SyncOutlined, FileTextOutlined, LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// --- MOCK DATA (Backend'den gelecek veriler) ---
const studentData = {
    name: "Ceren Şirin",
    studentNo: "2024106006",
    department: "Kimya Öğretmenliği",
    status: "Süreç Devam Ediyor", // Başvuru Alındı, Atama Bekliyor, Süreç Devam Ediyor, Sonlandı
    appointments: [
        {
            id: 1,
            date: "20.11.2025",
            time: "10:00",
            type: "Online",
            link: "https://zoom.us/j/123456789", // Eğer online ise link
            location: null,
            therapist: "Rabia Özdemir",
            status: "upcoming" // upcoming, completed, cancelled
        },
        {
            id: 2,
            date: "12.11.2025",
            time: "14:00",
            type: "Yüz Yüze",
            link: null,
            location: "Kuzey Kampüs, BÜREM Ofisi, Oda 204",
            therapist: "Rabia Özdemir",
            status: "completed"
        }
    ]
};

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [hasPendingEvaluation, setHasPendingEvaluation] = useState(false); // Değerlendirme anketi bekliyor mu?

    const handleLogout = () => {
        // Token temizleme işlemleri...
        navigate('/');
    };

    const handleGoToEvaluation = () => {
        navigate('/degerlendirme-formu');
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* HEADER */}
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#003366', padding: '0 24px' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>BÜREM Öğrenci Paneli</div>
                <div style={{ color: 'white' }}>
                    <Space>
                        <span>{studentData.name}</span>
                        <Button type="text" icon={<LogoutOutlined />} style={{ color: '#ffccc7' }} onClick={handleLogout}>Çıkış</Button>
                    </Space>
                </div>
            </Header>

            <Content style={{ padding: '24px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                
                {/* 1. BÖLÜM: DURUM BİLGİLENDİRMESİ */}
                <div style={{ marginBottom: 24 }}>
                    <Alert
                        message="Başvuru Durumu"
                        description={
                            <div style={{marginTop: 5}}>
                                <Tag color="processing" style={{ fontSize: 14, padding: '5px 10px' }}>
                                    {studentData.status}
                                </Tag>
                                <span style={{marginLeft: 10, fontSize: 12, color: '#666'}}>
                                    Son güncelleme: 20.11.2025
                                </span>
                            </div>
                        }
                        type="info"
                        showIcon
                        icon={<SyncOutlined spin />}
                    />
                </div>

                {/* DEĞERLENDİRME UYARISI (EĞER VARSA) */}
                {hasPendingEvaluation && (
                    <Alert
                        message="Değerlendirme Formu Bekliyor"
                        description="Görüşme süreciniz tamamlanmıştır. Lütfen hizmet kalitemizi artırmamız için değerlendirme formunu doldurunuz."
                        type="warning"
                        showIcon
                        action={
                            <Button size="small" type="primary" onClick={handleGoToEvaluation}>
                                Formu Doldur
                            </Button>
                        }
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Row gutter={[24, 24]}>
                    {/* 2. BÖLÜM: AKTİF / GELECEK RANDEVU KARTI */}
                    <Col xs={24} md={14}>
                        <Card title="Yaklaşan Randevunuz" bordered={false} style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            {studentData.appointments.filter(a => a.status === 'upcoming').length > 0 ? (
                                studentData.appointments.filter(a => a.status === 'upcoming').map(app => (
                                    <div key={app.id}>
                                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                            <Title level={2} style={{ color: '#1e4a8b', margin: 0 }}>{app.time}</Title>
                                            <Text type="secondary" style={{ fontSize: 16 }}>{app.date}</Text>
                                        </div>
                                        
                                        <Descriptions column={1} bordered size="small">
                                            <Descriptions.Item label="Uzman"><b>{app.therapist}</b></Descriptions.Item>
                                            <Descriptions.Item label="Görüşme Türü">
                                                <Tag color={app.type === 'Online' ? 'purple' : 'blue'}>{app.type}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label={app.type === 'Online' ? 'Bağlantı' : 'Konum'}>
                                                {app.type === 'Online' ? (
                                                    <a href={app.link || '#'} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <VideoCameraOutlined /> Görüşmeye Katıl (Zoom)
                                                    </a>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <EnvironmentOutlined /> {app.location}
                                                    </span>
                                                )}
                                            </Descriptions.Item>
                                        </Descriptions>
                                        
                                        <div style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
                                            * Randevu saatinizden 5 dakika önce hazır bulunmanız rica olunur.
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <CheckCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 10 }} />
                                    <p>Planlanmış aktif bir randevunuz bulunmamaktadır.</p>
                                    <p>Sekreterya tarafından atama yapıldığında burada görünecektir.</p>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* 3. BÖLÜM: GEÇMİŞ RANDEVULAR (TIMELINE) */}
                    <Col xs={24} md={10}>
                        <Card title="Geçmiş Görüşmeler" bordered={false} style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <Timeline>
                                {studentData.appointments.filter(a => a.status === 'completed').map(app => (
                                    <Timeline.Item key={app.id} color="green">
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{app.date}</p>
                                        <p style={{ margin: 0, fontSize: 12 }}>{app.therapist} ile görüşme</p>
                                        <Tag style={{ marginTop: 5 }}>{app.type}</Tag>
                                    </Timeline.Item>
                                ))}
                                <Timeline.Item color="blue">
                                    <p style={{ margin: 0, fontSize: 12 }}>Başvuru oluşturuldu</p>
                                    <p style={{ margin: 0, fontSize: 10, color: '#999' }}>01.11.2025</p>
                                </Timeline.Item>
                            </Timeline>
                        </Card>
                    </Col>
                </Row>

                {/* 4. BÖLÜM: İLETİŞİM & YARDIM */}
                <Card style={{ marginTop: 24, background: '#e6f7ff', borderColor: '#91d5ff' }}>
                    <Row align="middle" justify="space-between">
                        <Col>
                            <Text strong style={{ color: '#0050b3' }}>Bir sorun mu yaşıyorsunuz?</Text>
                            <div style={{ fontSize: 13 }}>Randevu iptali veya acil durumlar için sekreterya ile iletişime geçebilirsiniz.</div>
                        </Col>
                        <Col>
                            <Button type="primary" ghost icon={<FileTextOutlined />}>BÜREM İletişim</Button>
                        </Col>
                    </Row>
                </Card>

            </Content>
            <Footer style={{ textAlign: 'center', color: '#888' }}>Bürem ©2025 Boğaziçi Üniversitesi</Footer>
        </Layout>
    );
};

export default StudentDashboard;