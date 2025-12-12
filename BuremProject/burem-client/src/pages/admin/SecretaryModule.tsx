import React, { useEffect, useState } from 'react';
import { Row, Col, Card, List, Button, Tag, Calendar, Badge, Popover, Typography, Table, Statistic, Avatar, Space } from 'antd';
import { 
    CalendarOutlined, 
    UserAddOutlined, 
    ScheduleOutlined, 
    CheckCircleOutlined, 
    ClockCircleOutlined,
    SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import agent from '../../api/agent';
import AppointmentModal from '../../components/AppointmentModal'; 

const { Text, Title } = Typography;
const PRIMARY_COLOR = '#1e4a8b';
const SECONDARY_COLOR = '#8cc8ea';
const CARD_SHADOW = '0 4px 12px rgba(0,0,0,0.05)';

const SecretaryModule = () => {
    // --- STATE YÖNETİMİ ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentName, setSelectedStudentName] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState(0); 
    
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [allAppointments, setAllAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- VERİ ÇEKME ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Atama Bekleyen Başvurular
                const pendingData = await agent.Sessions.getPending();
                setPendingStudents(pendingData || []);
                
                // 2. Tüm Randevu Geçmişi
                const appointmentsData = await agent.Appointments.getAll();
                setAllAppointments(appointmentsData || []);
            } catch (error) {
                console.error("Veri yükleme hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isModalOpen]); // Modal kapanınca listeleri güncelle

    // --- TAKVİM HÜCRE RENDER (GÜN İÇİNDEKİ RANDEVULAR) ---
    const dateCellRender = (value: dayjs.Dayjs) => {
        const dateString = value.format('DD.MM.YYYY');
        const listData = allAppointments.filter(app => app.date === dateString);

        return (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {listData.map((item, index) => (
                    <li key={index} style={{marginBottom: 3}}>
                        <Popover 
                            title={<Text strong>{item.time} - {item.studentName}</Text>} 
                            content={
                                <div style={{maxWidth: 250}}>
                                    <p><strong>Terapist:</strong> {item.therapistName}</p>
                                    <p><strong>Tür:</strong> {item.type}</p>
                                    <p><strong>Durum:</strong> <Tag color={item.status === 'Planned' ? 'blue' : 'green'}>{item.status}</Tag></p>
                                </div>
                            }
                        >
                            {/* Takvimde görünen kısa özet (Saat ve İsim) */}
                            <Badge 
                                status={item.status === 'Planned' ? 'processing' : item.status === 'Completed' ? 'success' : 'default'} 
                                text={<span style={{fontSize: 10}}>{item.time} {item.studentName.split(' ')[0]}</span>} 
                            />
                        </Popover>
                    </li>
                ))}
            </ul>
        );
    };

    // --- TABLO SÜTUNLARI (TÜM LİSTE İÇİN) ---
    const appointmentColumns = [
        { 
            title: 'Tarih & Saat', 
            key: 'datetime',
            width: 140,
            render: (text: any, r: any) => (
                <span>
                    <CalendarOutlined style={{marginRight:5, color:'#888'}}/>{r.date} <br/>
                    <ClockCircleOutlined style={{marginRight:5, color:'#888'}}/>{r.time}
                </span>
            ),
            sorter: (a: any, b: any) => dayjs(a.date, 'DD.MM.YYYY').unix() - dayjs(b.date, 'DD.MM.YYYY').unix()
        },
        { 
            title: 'Öğrenci', 
            dataIndex: 'studentName', 
            key: 'studentName', 
            render: (t: string) => <b>{t}</b> 
        },
        { 
            title: 'Terapist', 
            dataIndex: 'therapistName', 
            key: 'therapistName',
            render: (t: string) => <Tag color="blue">{t}</Tag>
        },
        { 
            title: 'Tip', 
            dataIndex: 'type', 
            key: 'type', 
            render: (t: string) => <Tag>{t}</Tag> 
        },
        { 
            title: 'Durum', 
            dataIndex: 'status', 
            key: 'status', 
            render: (status: string) => {
                let color = status === 'Planned' ? 'blue' : (status === 'Completed' ? 'green' : 'red');
                let label = status === 'Planned' ? 'Planlandı' : (status === 'Completed' ? 'Tamamlandı' : 'İptal');
                return <Tag color={color}>{label}</Tag>;
            }
        }
    ];

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', padding: '20px', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* 1. ÜST İSTATİSTİK KARTLARI */}
            <Row gutter={16} style={{marginBottom: 20}}>
                <Col span={8}>
                    <Card bordered={false} style={{boxShadow: CARD_SHADOW, borderRadius: 8}}>
                        <Statistic 
                            title="Bekleyen Başvurular" 
                            value={pendingStudents.length} 
                            prefix={<UserAddOutlined style={{color: '#faad14'}}/>} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{boxShadow: CARD_SHADOW, borderRadius: 8}}>
                        <Statistic 
                            title="Toplam Randevu" 
                            value={allAppointments.length} 
                            prefix={<CalendarOutlined style={{color: PRIMARY_COLOR}}/>} 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{boxShadow: CARD_SHADOW, borderRadius: 8}}>
                        <Statistic 
                            title="Tamamlanan Görüşme" 
                            value={allAppointments.filter(x => x.status === 'Completed').length} 
                            prefix={<CheckCircleOutlined style={{color: '#52c41a'}}/>} 
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={24}>
                {/* 2. SOL PANEL: ATAMA BEKLEYENLER LİSTESİ */}
                <Col xs={24} lg={8}>
                    <Card 
                        title={<span style={{color: '#d48806'}}><UserAddOutlined /> Atama Bekleyenler</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, height: '100%', marginBottom: 24, borderRadius: 8}}
                        bodyStyle={{padding: '10px 15px', maxHeight: 650, overflowY: 'auto'}}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={pendingStudents}
                            loading={loading}
                            renderItem={(item) => (
                                <List.Item 
                                    actions={[
                                        <Button 
                                            type="primary" 
                                            size="small" 
                                            onClick={() => { 
                                                setSelectedStudentName(item.name); 
                                                setSelectedSessionId(item.id); 
                                                setIsModalOpen(true); 
                                            }}
                                            style={{backgroundColor: SECONDARY_COLOR, borderColor: SECONDARY_COLOR}}
                                        >
                                            Ata
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar style={{backgroundColor: '#ffe58f', color: '#d48806'}}>{item.name?.charAt(0)}</Avatar>}
                                        title={<Text style={{fontSize: 13}} strong>{item.name}</Text>}
                                        description={
                                            <div style={{fontSize: 11, color: '#888'}}>
                                                <div>{item.department}</div>
                                                <div><CalendarOutlined /> Başvuru: {dayjs(item.requestDate).format('DD.MM.YYYY')}</div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* 3. SAĞ PANEL: GELİŞMİŞ TAKVİM GÖRÜNÜMÜ */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={<span style={{color: PRIMARY_COLOR}}><CalendarOutlined /> Genel Randevu Takvimi</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, height: '100%', borderRadius: 8}}
                    >
                        <Calendar 
                            cellRender={dateCellRender} 
                            // fullscreen={false} // İsteğe bağlı: Küçük takvim için bunu açabilirsiniz
                        />
                    </Card>
                </Col>
            </Row>

            {/* 4. ALT PANEL: TÜM RANDEVULAR TABLOSU */}
            <Row style={{marginTop: 24}}>
                <Col span={24}>
                    <Card 
                        title={<span style={{color: '#0050b3'}}><ScheduleOutlined /> Tüm Randevu Kayıtları (Detaylı Liste)</span>} 
                        bordered={false} 
                        style={{boxShadow: CARD_SHADOW, borderRadius: 8}}
                    >
                        <Table 
                            dataSource={allAppointments} 
                            columns={appointmentColumns} 
                            rowKey="id" 
                            size="small" 
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 5. RANDEVU OLUŞTURMA MODALI */}
            <AppointmentModal 
                visible={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                studentName={selectedStudentName} 
                sessionId={selectedSessionId} 
                roleId={2} // Sekreter Rolü
            />
        </div>
    );
};

export default SecretaryModule;