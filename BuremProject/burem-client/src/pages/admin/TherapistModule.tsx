import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Space, Avatar, Badge, Button, Drawer, Typography, Descriptions, List, Divider, Timeline, Popover, Calendar } from 'antd';
import { 
    ClockCircleOutlined, 
    CalendarOutlined, 
    UserOutlined, 
    FolderOpenOutlined, 
    EditOutlined, 
    CheckCircleOutlined, 
    FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import agent from '../../api/agent'; 
import AppointmentModal from '../../components/AppointmentModal';

const { Title, Text } = Typography;
const PRIMARY_COLOR = '#1e4a8b';
const SECONDARY_COLOR = '#8cc8ea';
const CARD_SHADOW = '0 4px 12px rgba(0,0,0,0.05)';

const TherapistModule = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal & Drawer State
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [sessionDetail, setSessionDetail] = useState<any | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const data = await agent.Appointments.getMyAppointments();
                setAppointments(data || []);
            } catch (error) {
                console.error("Hata:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [isAppointmentModalOpen]); 

    // --- DOSYAYI AÇ ---
    const handleOpenDrawer = async (appointment: any) => {
        setSelectedAppointment(appointment);
        setDrawerVisible(true);
        setSessionDetail(null); 
        try {
            // studentId artık SessionId olarak dönüyor (Backend güncellemesi ile)
            const sessionId = Number(appointment.studentId);
            if(sessionId > 0) {
                const detail = await agent.Sessions.getById(sessionId); 
                setSessionDetail(detail);
            }
        } catch { }
    };

    const dateCellRender = (value: dayjs.Dayjs) => {
        const dateString = value.format('DD.MM.YYYY');
        const listData = appointments.filter(app => app.date === dateString);
        return (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {listData.map((item, index) => (
                    <li key={index} style={{marginBottom: 3}}>
                        <Popover 
                            title={<Text strong>{item.time} - {item.studentName}</Text>} 
                            content={<p>Durum: {item.status}</p>}
                        >
                            <Badge 
                                status={item.status === 'Planned' ? 'processing' : 'success'} 
                                text={<span style={{fontSize: 10}}>{item.time} {item.studentName.split(' ')[0]}</span>} 
                            />
                        </Popover>
                    </li>
                ))}
            </ul>
        );
    };

    const today = dayjs().format('DD.MM.YYYY');
    const todayAppointments = appointments.filter(a => a.date === today);

    const columns = [
        { title: 'Tarih', dataIndex: 'date', key: 'date', width: 100 },
        { title: 'Saat', dataIndex: 'time', key: 'time', width: 80, render: (t:any) => <Tag color="blue">{t}</Tag> },
        
        { title: 'Öğrenci Adı Soyadı', dataIndex: 'studentName', key: 'studentName', render: (text: string) => <Text strong>{text}</Text> },
        
        { title: 'Tip', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
        { title: 'Durum', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s==='Planned'?'processing':'success'} text={s==='Planned'?'Bekleniyor':s} /> },
        { 
            title: 'İşlemler', 
            key: 'action', 
            render: (_: any, r: any) => (
                <Space>
                    <Button size="small" icon={<FolderOpenOutlined />} onClick={() => handleOpenDrawer(r)}>Dosya</Button>
                    <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => { setSelectedAppointment(r); setIsAppointmentModalOpen(true); }} style={{backgroundColor: PRIMARY_COLOR}}>Yönet</Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', padding: '20px', background: '#f5f7fa', minHeight: '100vh' }}>
            
            <Row gutter={24}>
                {/* SOL: GÜNLÜK AJANDA */}
                <Col xs={24} lg={8}>
                    <Card 
                        title={<span style={{color: PRIMARY_COLOR, fontSize: 16}}><ClockCircleOutlined /> Bugün ({today})</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, marginBottom: 24, height: '100%', borderRadius: 8}}
                    >
                        {todayAppointments.length > 0 ? (
                            <Timeline
                                items={todayAppointments.map(app => ({
                                    color: app.status === 'Completed' ? 'green' : 'blue',
                                    children: (
                                        <>
                                            <Text strong>{app.time}</Text> - {app.studentName} <br/>
                                            <Text type="secondary" style={{fontSize: 12}}>{app.type}</Text>
                                            <div style={{marginTop: 5}}>
                                                <Button size="small" type="dashed" onClick={() => handleOpenDrawer(app)}>Detay</Button>
                                            </div>
                                        </>
                                    ),
                                }))}
                            />
                        ) : (
                            <div style={{textAlign: 'center', padding: '40px 0', color: '#bbb'}}>
                                <CheckCircleOutlined style={{fontSize: 32, marginBottom: 10}} />
                                <p>Bugün için randevu yok.</p>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* SAĞ: TAKVİM */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={<span style={{color: PRIMARY_COLOR}}><CalendarOutlined /> Çalışma Takvimim</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, borderRadius: 8, height: '100%'}}
                    >
                        <Calendar cellRender={dateCellRender} />
                    </Card>
                </Col>
            </Row>

            {/* ALT: TÜM LİSTE */}
            <Row style={{marginTop: 24}}>
                <Col span={24}>
                    <Card 
                        title={<span style={{color: '#13c2c2'}}><UserOutlined /> Danışan Listesi & Geçmiş</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, borderRadius: 8}}
                    >
                        <Table 
                            dataSource={appointments} 
                            columns={columns} 
                            rowKey="id" 
                            pagination={{ pageSize: 8 }} 
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* DOSYA DETAYI (DRAWER) */}
                <Drawer title="Danışan Başvuru Dosyası" placement="right" width={650} onClose={() => setDrawerVisible(false)} open={drawerVisible}>
        {sessionDetail ? (
            <div>
                <div style={{textAlign:'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0'}}>
                    <Avatar size={64} style={{backgroundColor: SECONDARY_COLOR}} icon={<UserOutlined />} />
                    <Title level={4} style={{marginTop: 10}}>{sessionDetail.studentName}</Title>
                    <Tag color="geekblue">{sessionDetail.studentNumber}</Tag>
                </div>
                
                {/* --- KİŞİSEL VE AKADEMİK BİLGİLER (ARTIK DOLU GELECEK) --- */}
                <Descriptions title="Öğrenci Bilgileri" column={1} size="small" bordered style={{marginBottom: 20}}>
                    <Descriptions.Item label="Fakülte / Bölüm">{sessionDetail.faculty} / {sessionDetail.department}</Descriptions.Item>
                    <Descriptions.Item label="Sınıf">{sessionDetail.classLevel}</Descriptions.Item>
                    <Descriptions.Item label="Telefon">{sessionDetail.phone}</Descriptions.Item>
                    <Descriptions.Item label="E-posta">{sessionDetail.email}</Descriptions.Item>
                </Descriptions>

                <Descriptions title="Başvuru Detayı" column={1} size="small" bordered>
                    <Descriptions.Item label="Başvuru Tarihi">{sessionDetail.sessionDate}</Descriptions.Item>
                    <Descriptions.Item label="Danışman">{sessionDetail.advisorName}</Descriptions.Item>
                    <Descriptions.Item label="Tercih">{sessionDetail.preferredMeetingType}</Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">Form Cevapları</Divider>
                <List
                    itemLayout="vertical"
                    dataSource={sessionDetail.answers || []}
                    renderItem={(item: any) => (
                        <List.Item style={{padding: '10px 0'}}>
                            <List.Item.Meta
                                title={<Text type="secondary" style={{fontSize: 13, fontWeight: 600}}>
                                    {item.questionTitle}
                                </Text>}
                                description={<div style={{marginTop: 5, padding: 10, background: '#f9f9f9', borderRadius: 6, color: '#333'}}>
                                    {item.answerValue}
                                </div>}
                            />
                        </List.Item>
                    )}
                />
            </div>
        ) : (
            <div style={{textAlign: 'center', marginTop: 50, color: '#999'}}>
                <p>Dosya içeriği yükleniyor...</p>
            </div>
        )}
    </Drawer>

            <AppointmentModal 
                visible={isAppointmentModalOpen} 
                onCancel={() => { setIsAppointmentModalOpen(false); setSelectedAppointment(null); }} 
                sessionId={0} 
                studentName={selectedAppointment?.studentName || ''}
                existingAppointment={selectedAppointment} 
                roleId={4} 
            />
        </div>
    );
};
export default TherapistModule;