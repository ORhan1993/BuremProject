import React, { useState } from 'react';
import { 
    Layout, Card, Table, Tag, Button, Tabs, Avatar, List, 
    Typography, Drawer, Descriptions, Badge, Timeline, Collapse, Space, Tooltip, Input, Row, Col, Divider
} from 'antd';
import { 
    CalendarOutlined, ClockCircleOutlined, UserOutlined, 
    FileTextOutlined, HistoryOutlined, CheckCircleOutlined, 
    CloseCircleOutlined, RightOutlined, MedicineBoxOutlined,
    EditOutlined, SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

// --- KURUMSAL KİMLİK ---
const PRIMARY_COLOR = '#1e4a8b'; 
const SECONDARY_COLOR = '#8cc8ea';
const BOUN_FONT = 'Helvetica, Arial, sans-serif';
const CARD_STYLE = { borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none', marginBottom: 20 };

// --- MOCK DATA (Terapist İçin) ---
const mockAppointments = [
    { id: 101, studentName: 'Ali Yılmaz', studentId: '20201001', date: dayjs().format('DD.MM.YYYY'), time: '10:00', type: 'Yüz Yüze', status: 'active', location: 'Kuzey Kampüs Oda 101' },
    { id: 102, studentName: 'Ayşe Demir', studentId: '20215002', date: dayjs().format('DD.MM.YYYY'), time: '14:00', type: 'Online', status: 'active', location: 'Zoom' },
    { id: 103, studentName: 'Mehmet Kaya', studentId: '20192030', date: '20.11.2025', time: '11:00', type: 'Yüz Yüze', status: 'completed', location: 'Güney Kampüs' },
    { id: 104, studentName: 'Zeynep Çelik', studentId: '20221040', date: '18.11.2025', time: '15:00', type: 'Online', status: 'cancelled', location: 'Zoom' },
];

const mockStudentDetails = {
    basicInfo: {
        department: 'Bilgisayar Mühendisliği',
        grade: '3. Sınıf',
        gpa: '3.45',
        scholarship: 'Tam Burslu',
        phone: '0555 123 45 67',
        emergencyContact: 'Veli Yılmaz (Baba) - 0532 111 22 33',
        riskLevel: 'Orta', // Terapist için önemli
    },
    formAnswers: [
        { question: 'Başvuru nedeniniz nedir?', answer: 'Son zamanlarda derslere odaklanmakta güçlük çekiyorum ve uyku düzenim bozuldu. Sınav kaygısı yaşıyorum.' },
        { question: 'Daha önce psikolojik destek aldınız mı?', answer: 'Evet, lise döneminde 3 ay kadar okul rehberlik servisi ile görüştüm.' },
        { question: 'Sürekli kullandığınız bir ilaç var mı?', answer: 'Hayır, kullanmıyorum.' },
        { question: 'İntihar düşüncesi veya kendine zarar verme eğilimi?', answer: 'Hayır, yok.' }, // Kritik soru
        { question: 'Ailede psikolojik rahatsızlık öyküsü?', answer: 'Anne tarafında depresyon öyküsü var.' }
    ],
    pastNotes: [
        { date: '10.11.2025', note: 'İlk görüşme yapıldı. Genel anksiyete belirtileri mevcut. Uyku hijyeni üzerine konuşuldu.' },
        { date: '03.11.2025', note: 'Ön görüşme (Başak Yılmaz tarafından): Öğrenci akademik baskı altında hissediyor.' }
    ]
};

const TherapistDashboard = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    const showDetail = (record: any) => {
        setSelectedAppointment(record);
        setDrawerVisible(true);
    };

    const closeDetail = () => {
        setDrawerVisible(false);
        setSelectedAppointment(null);
    };

    // Tablo Kolonları
    const columns = [
        { 
            title: 'Tarih & Saat', 
            dataIndex: 'date', 
            key: 'date',
            render: (text: string, record: any) => (
                <div>
                    <div style={{fontWeight: 'bold', color: '#333'}}>{text}</div>
                    <div style={{color: PRIMARY_COLOR, fontSize: '12px'}}>{record.time}</div>
                </div>
            )
        },
        { 
            title: 'Danışan (Öğrenci)', 
            dataIndex: 'studentName', 
            key: 'studentName',
            render: (text: string, record: any) => (
                <Space>
                    <Avatar style={{backgroundColor: SECONDARY_COLOR}} icon={<UserOutlined />} />
                    <div>
                        <div style={{fontWeight: 600}}>{text}</div>
                        <div style={{fontSize: '11px', color: '#888'}}>{record.studentId}</div>
                    </div>
                </Space>
            )
        },
        { 
            title: 'Görüşme Tipi', 
            dataIndex: 'type', 
            key: 'type',
            render: (t: string) => <Tag color={t === 'Online' ? 'purple' : 'geekblue'}>{t}</Tag>
        },
        { 
            title: 'Durum', 
            dataIndex: 'status', 
            key: 'status',
            render: (status: string) => {
                const map: any = { 'active': {c:'processing', t:'Bekleniyor'}, 'completed': {c:'success', t:'Tamamlandı'}, 'cancelled': {c:'error', t:'İptal'} };
                return <Badge status={map[status].c} text={map[status].t} />;
            }
        },
        {
            title: 'İşlem',
            key: 'action',
            render: (_: any, record: any) => (
                <Button type="primary" size="small" onClick={() => showDetail(record)} style={{backgroundColor: PRIMARY_COLOR, borderRadius: 4}}>
                    Dosyayı Aç <RightOutlined />
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 24, fontFamily: BOUN_FONT, background: '#f0f2f5', minHeight: '100vh' }}>
            {/* ÜST BAŞLIK */}
            <div style={{ marginBottom: 24, borderLeft: `4px solid ${PRIMARY_COLOR}`, paddingLeft: 16, background: '#fff', padding: 16, borderRadius: '0 8px 8px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                <Title level={3} style={{ margin: 0, color: PRIMARY_COLOR, fontFamily: BOUN_FONT }}>Terapist Paneli</Title>
                <Text type="secondary">Randevularınızı yönetin ve danışan dosyalarını inceleyin.</Text>
            </div>

            <Row gutter={24}>
                {/* SOL: RANDEVU LİSTELERİ */}
                <Col span={24}>
                    <Card style={CARD_STYLE} bodyStyle={{ padding: 0 }}>
                        <Tabs 
                            defaultActiveKey="1" 
                            type="card"
                            size="large"
                            tabBarStyle={{ margin: 0, padding: '10px 10px 0 10px', background: '#fafafa' }}
                            items={[
                                {
                                    key: '1',
                                    label: <span><CalendarOutlined /> Güncel Randevularım</span>,
                                    children: <Table dataSource={mockAppointments.filter(x => x.status === 'active')} columns={columns} rowKey="id" pagination={false} style={{padding: 20}} />
                                },
                                {
                                    key: '2',
                                    label: <span><HistoryOutlined /> Geçmiş Randevular</span>,
                                    children: <Table dataSource={mockAppointments.filter(x => x.status !== 'active')} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} style={{padding: 20}} />
                                }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            {/* SAĞDAN AÇILAN DETAY (DRAWER) */}
            <Drawer
                title={<span style={{color: PRIMARY_COLOR, fontSize: 18}}><MedicineBoxOutlined /> Danışan Dosyası</span>}
                placement="right"
                width={700}
                onClose={closeDetail}
                open={drawerVisible}
                headerStyle={{borderBottom: `2px solid ${SECONDARY_COLOR}`}}
            >
                {selectedAppointment && (
                    <div style={{fontFamily: BOUN_FONT}}>
                        {/* 1. SEVİYE: TEMEL BİLGİLER (HEADER GİBİ) */}
                        <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #eee' }}>
                            <Row align="middle" gutter={16}>
                                <Col>
                                    <Avatar size={64} style={{ backgroundColor: PRIMARY_COLOR }}>{selectedAppointment.studentName.charAt(0)}</Avatar>
                                </Col>
                                <Col flex="auto">
                                    <Title level={4} style={{ margin: 0, color: '#333' }}>{selectedAppointment.studentName}</Title>
                                    <Text type="secondary">{selectedAppointment.studentId} | {mockStudentDetails.basicInfo.department}</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag color="orange">Risk: {mockStudentDetails.basicInfo.riskLevel}</Tag>
                                        <Tag color="blue">{mockStudentDetails.basicInfo.scholarship}</Tag>
                                    </div>
                                </Col>
                                <Col>
                                    <Button type="primary" icon={<ClockCircleOutlined />} style={{backgroundColor: '#52c41a', borderColor: '#52c41a'}}>Görüşmeyi Başlat</Button>
                                </Col>
                            </Row>
                            <Divider style={{margin: '15px 0'}} />
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Sınıf">{mockStudentDetails.basicInfo.grade}</Descriptions.Item>
                                <Descriptions.Item label="GPA">{mockStudentDetails.basicInfo.gpa}</Descriptions.Item>
                                <Descriptions.Item label="Telefon">{mockStudentDetails.basicInfo.phone}</Descriptions.Item>
                                <Descriptions.Item label="Acil Durum">{mockStudentDetails.basicInfo.emergencyContact}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        {/* 2. SEVİYE: DETAYLI BAŞVURU BİLGİLERİ & GEÇMİŞ */}
                        <Tabs defaultActiveKey="1" items={[
                            {
                                key: '1',
                                label: 'Başvuru Formu & Detaylar',
                                children: (
                                    <Collapse defaultActiveKey={['1']} ghost expandIconPosition="end">
                                        <Panel header={<span style={{fontWeight: 'bold', color: PRIMARY_COLOR}}>Başvuru Soruları ve Cevapları</span>} key="1">
                                            <List
                                                itemLayout="vertical"
                                                dataSource={mockStudentDetails.formAnswers}
                                                renderItem={(item, index) => (
                                                    <List.Item style={{padding: '10px 0'}}>
                                                        <List.Item.Meta
                                                            title={<Text strong style={{fontSize: 13}}>{index + 1}. {item.question}</Text>}
                                                            description={<div style={{padding: '8px', background: '#f4f8fc', borderRadius: 4, color: '#444'}}>{item.answer}</div>}
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        </Panel>
                                        <Panel header={<span style={{fontWeight: 'bold', color: PRIMARY_COLOR}}>Akademik & Sosyal Geçmiş</span>} key="2">
                                            <p>Öğrencinin OBS sisteminden çekilen detaylı akademik verileri ve sosyal kulüp üyelikleri burada yer alacaktır.</p>
                                        </Panel>
                                    </Collapse>
                                )
                            },
                            {
                                key: '2',
                                label: 'Görüşme Notları',
                                children: (
                                    <div>
                                        <div style={{marginBottom: 20}}>
                                            <Text strong>Bu Seans İçin Notlarınız:</Text>
                                            <TextArea rows={4} placeholder="Görüşme notlarını buraya giriniz..." style={{marginTop: 8}} />
                                            <div style={{textAlign: 'right', marginTop: 8}}>
                                                <Button type="primary" icon={<SaveOutlined />} style={{backgroundColor: PRIMARY_COLOR}}>Notu Kaydet</Button>
                                            </div>
                                        </div>
                                        <Divider orientation="left">Geçmiş Notlar</Divider>
                                        <Timeline>
                                            {mockStudentDetails.pastNotes.map((note, i) => (
                                                <Timeline.Item key={i} color="blue">
                                                    <Text type="secondary" style={{fontSize: 12}}>{note.date}</Text>
                                                    <p>{note.note}</p>
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    </div>
                                )
                            }
                        ]} />
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default TherapistDashboard;