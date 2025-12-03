import React, { useState } from 'react';
import { 
    Layout, Card, Table, Tag, Button, Tabs, Avatar, List, 
    Typography, Drawer, Descriptions, Badge, Timeline, Collapse, Space, 
    Tooltip, Input, Row, Col, Divider, message, Modal, DatePicker, Select, Alert, Form, InputNumber
} from 'antd';
import { 
    CalendarOutlined, ClockCircleOutlined, UserOutlined, 
    FileTextOutlined, HistoryOutlined, CheckCircleOutlined, 
    CloseCircleOutlined, RightOutlined, MedicineBoxOutlined,
    EditOutlined, SaveOutlined, PlusOutlined, WarningOutlined,
    TeamOutlined // Grup ikonu eklendi
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

// --- KURUMSAL KİMLİK ---
const PRIMARY_COLOR = '#1e4a8b'; 
const SECONDARY_COLOR = '#8cc8ea';
const BOUN_FONT = 'Helvetica, Arial, sans-serif';
const CARD_STYLE = { borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none', marginBottom: 20 };

// --- MOCK DATA (BİREYSEL) ---
const mockAppointments = [
    { id: 101, studentName: 'Ali Yılmaz', studentId: '20201001', date: dayjs().format('DD.MM.YYYY'), time: '10:00', type: 'Yüz Yüze', status: 'active', currentSessionCount: 1, riskLevel: 'Düşük' },
    { id: 102, studentName: 'Ayşe Demir', studentId: '20215002', date: dayjs().format('DD.MM.YYYY'), time: '14:00', type: 'Online', status: 'active', currentSessionCount: 7, riskLevel: 'Yüksek' },
    { id: 103, studentName: 'Mehmet Kaya', studentId: '20192030', date: '20.11.2025', time: '11:00', type: 'Yüz Yüze', status: 'completed', currentSessionCount: 8, riskLevel: 'Orta' },
];

// --- MOCK DATA (GRUP ÇALIŞMALARI) ---
const mockGroups = [
    { id: 1, groupName: 'Sosyal Beceri Grubu', startDate: '01.12.2025', endDate: '01.02.2026', sessionCount: 8, status: 'Devam Ediyor' },
    { id: 2, groupName: 'Sınav Kaygısı Grubu', startDate: '10.10.2025', endDate: '10.12.2025', sessionCount: 6, status: 'Tamamlandı' },
];

const mockStudentDetails = {
    basicInfo: {
        department: 'Bilgisayar Mühendisliği',
        grade: '3. Sınıf',
        gpa: '3.45',
        scholarship: 'Tam Burslu',
        phone: '0555 123 45 67',
        emergencyContact: 'Veli Yılmaz (Baba) - 0532 111 22 33',
    },
    clinicalInfo: {
        depressionScore: 18,
        anxietyScore: 12,
        suicideRisk: 'Yok',
        previousTherapy: 'Evet, lise döneminde.',
        medication: 'Kullanmıyor'
    },
    formAnswers: [
        { question: 'Başvuru nedeniniz nedir?', answer: 'Son zamanlarda derslere odaklanmakta güçlük çekiyorum ve uyku düzenim bozuldu.' },
        { question: 'İştah değişikliği yaşıyor musunuz?', answer: 'Evet, iştahım çok azaldı.' },
        { question: 'Umutsuzluk hissediyor musunuz?', answer: 'Bazen geleceğe dair kaygılıyım.' }
    ],
    pastNotes: [
        { date: '10.11.2025', sessionNo: 1, note: 'İlk görüşme. Tanışma ve anamnez alındı. Uyku hijyeni konuşuldu.' },
        { date: '17.11.2025', sessionNo: 2, note: 'Bilişsel çarpıtmalar üzerine çalışıldı.' }
    ]
};

const TherapistDashboard = () => {
    // Mevcut State'ler
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [noteInput, setNoteInput] = useState("");
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

    // --- YENİ: GRUP ÇALIŞMASI STATE'LERİ ---
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupForm] = Form.useForm();

    // Detay panelini aç
    const showDetail = (record: any) => {
        setSelectedAppointment(record);
        setDrawerVisible(true);
    };

    const closeDetail = () => {
        setDrawerVisible(false);
        setSelectedAppointment(null);
        setNoteInput("");
    };

    const handleAddSession = () => {
        if (!selectedAppointment) return;
        if (selectedAppointment.currentSessionCount >= 8) {
            Modal.error({
                title: 'Maksimum Seans Sınırı',
                content: 'Bu öğrenci ile maksimum görüşme sayısı olan 8 seansa ulaşılmıştır.',
            });
            return;
        }
        setIsSessionModalOpen(true);
    };

    const saveNewSession = () => {
        message.success(`Randevu oluşturuldu!`);
        setIsSessionModalOpen(false);
    };

    const saveNotes = () => {
        if(!noteInput) return;
        message.success('Gizli notlarınız şifrelenerek kaydedildi.');
        setNoteInput("");
    };

    // --- YENİ: GRUP KAYDETME FONKSİYONU ---
    const handleSaveGroup = (values: any) => {
        // Backend API çağrısı burada yapılacak (agent.Groups.create)
        console.log("Kaydedilecek Grup:", values);
        message.success('Grup çalışması başarıyla oluşturuldu.');
        setIsGroupModalOpen(false);
        groupForm.resetFields();
    };

    // Tablo Kolonları (Bireysel)
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
            title: 'Danışan Bilgisi', 
            dataIndex: 'studentName', 
            key: 'studentName',
            render: (text: string, record: any) => (
                <Space>
                    <Avatar style={{backgroundColor: record.riskLevel === 'Yüksek' ? '#f5222d' : SECONDARY_COLOR}} icon={<UserOutlined />} />
                    <div>
                        <div style={{fontWeight: 600}}>{text}</div>
                        <div style={{fontSize: '11px', color: '#888'}}>{record.studentId}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'İlerleme',
            key: 'progress',
            render: (_:any, record:any) => (
                <Tooltip title={`${record.currentSessionCount}. Seans`}>
                    <div style={{width: 100}}>
                        <div style={{fontSize: 10, marginBottom: 2, display:'flex', justifyContent:'space-between'}}>
                            <span>İlerleme</span>
                            <span>{record.currentSessionCount}/8</span>
                        </div>
                        <div style={{height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden'}}>
                            <div style={{
                                width: `${(record.currentSessionCount / 8) * 100}%`, 
                                height: '100%', 
                                background: record.currentSessionCount >= 7 ? '#faad14' : '#52c41a'
                            }} />
                        </div>
                    </div>
                </Tooltip>
            )
        },
        { 
            title: 'Risk', 
            dataIndex: 'riskLevel', 
            key: 'riskLevel',
            render: (level: string) => {
                let color = 'green';
                if(level === 'Orta') color = 'orange';
                if(level === 'Yüksek') color = 'red';
                return <Tag color={color}>{level}</Tag>
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

    // --- YENİ: GRUP TABLO KOLONLARI ---
    const groupColumns = [
        { title: 'Grup Adı', dataIndex: 'groupName', key: 'groupName', render: (t:any) => <b>{t}</b> },
        { title: 'Başlangıç', dataIndex: 'startDate', key: 'startDate' },
        { title: 'Bitiş', dataIndex: 'endDate', key: 'endDate' },
        { title: 'Oturum', dataIndex: 'sessionCount', key: 'sessionCount', render: (c:any) => <Tag>{c} Oturum</Tag> },
        { title: 'Durum', dataIndex: 'status', key: 'status', render: (s:any) => <Badge status={s === 'Devam Ediyor' ? 'processing' : 'default'} text={s} /> },
        { title: 'İşlem', key: 'action', render: () => <Button size="small">Detay</Button> }
    ];

    return (
        <div style={{ padding: 24, fontFamily: BOUN_FONT, background: '#f0f2f5', minHeight: '100vh' }}>
            {/* ÜST BAŞLIK */}
            <div style={{ marginBottom: 24, borderLeft: `4px solid ${PRIMARY_COLOR}`, paddingLeft: 16, background: '#fff', padding: 16, borderRadius: '0 8px 8px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                <Title level={3} style={{ margin: 0, color: PRIMARY_COLOR, fontFamily: BOUN_FONT }}>Terapist Paneli</Title>
                <Text type="secondary">Danışanlarınızın seans takibi, klinik notları ve süreç yönetimi.</Text>
            </div>

            <Row gutter={24}>
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
                                    label: <span><CalendarOutlined /> Aktif Danışanlar</span>,
                                    children: <Table dataSource={mockAppointments.filter(x => x.status === 'active')} columns={columns} rowKey="id" pagination={false} style={{padding: 20}} />
                                },
                                {
                                    key: '2',
                                    label: <span><HistoryOutlined /> Arşiv / Tamamlananlar</span>,
                                    children: <Table dataSource={mockAppointments.filter(x => x.status !== 'active')} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} style={{padding: 20}} />
                                },
                                // --- YENİ EKLENEN SEKME: GRUP ÇALIŞMALARI ---
                                {
                                    key: '3',
                                    label: <span><TeamOutlined /> Grup Çalışmaları</span>,
                                    children: (
                                        <div style={{padding: 20}}>
                                            <div style={{marginBottom: 16, display: 'flex', justifyContent: 'flex-end'}}>
                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsGroupModalOpen(true)}>
                                                    Yeni Grup Oluştur
                                                </Button>
                                            </div>
                                            <Table 
                                                dataSource={mockGroups} 
                                                columns={groupColumns} 
                                                rowKey="id" 
                                                pagination={false} 
                                            />
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            {/* SAĞDAN AÇILAN DETAY (DRAWER) */}
            <Drawer
                title={
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'90%'}}>
                        <span style={{color: PRIMARY_COLOR, fontSize: 18}}><MedicineBoxOutlined /> Danışan Dosyası</span>
                        {selectedAppointment && (
                            <Tag color="blue">{selectedAppointment.currentSessionCount}. Görüşme</Tag>
                        )}
                    </div>
                }
                placement="right"
                width={800}
                onClose={closeDetail}
                open={drawerVisible}
                headerStyle={{borderBottom: `2px solid ${SECONDARY_COLOR}`}}
            >
                {selectedAppointment && (
                    <div style={{fontFamily: BOUN_FONT}}>
                        {/* Drawer İçeriği (Değişiklik yok) */}
                        <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #eee' }}>
                            <Row align="middle" gutter={16}>
                                <Col>
                                    <Avatar size={64} style={{ backgroundColor: PRIMARY_COLOR }}>{selectedAppointment.studentName.charAt(0)}</Avatar>
                                </Col>
                                <Col flex="auto">
                                    <Title level={4} style={{ margin: 0, color: '#333' }}>{selectedAppointment.studentName}</Title>
                                    <Text type="secondary">{selectedAppointment.studentId} | {mockStudentDetails.basicInfo.department}</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Space>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSession} style={{backgroundColor: '#52c41a', borderColor: '#52c41a'}}>
                                                Yeni Seans Planla
                                            </Button>
                                            <Button danger>Süreci Sonlandır</Button>
                                        </Space>
                                    </div>
                                </Col>
                            </Row>
                            <Divider style={{margin: '15px 0'}} />
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Tel">{mockStudentDetails.basicInfo.phone}</Descriptions.Item>
                                <Descriptions.Item label="Acil">{mockStudentDetails.basicInfo.emergencyContact}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        <Tabs defaultActiveKey="1" items={[
                            {
                                key: '1',
                                label: 'Klinik Görünüm & Anketler',
                                children: (
                                    <div>
                                        <Alert
                                            message="Klinik Değerlendirme Özeti"
                                            description={
                                                <Row gutter={16} style={{marginTop: 10}}>
                                                    <Col span={8}>
                                                        <Card size="small" title="Depresyon (PHQ-9)">
                                                            <Text strong style={{fontSize: 18, color: '#d4380d'}}>{mockStudentDetails.clinicalInfo.depressionScore}</Text> / 27
                                                        </Card>
                                                    </Col>
                                                    <Col span={8}>
                                                        <Card size="small" title="Kaygı (GAD-7)">
                                                            <Text strong style={{fontSize: 18, color: '#faad14'}}>{mockStudentDetails.clinicalInfo.anxietyScore}</Text> / 21
                                                        </Card>
                                                    </Col>
                                                    <Col span={8}>
                                                        <Card size="small" title="İntihar Riski">
                                                            <Tag color="green">{mockStudentDetails.clinicalInfo.suicideRisk}</Tag>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            }
                                            type="info"
                                            showIcon
                                            style={{marginBottom: 20}}
                                        />
                                        <Collapse defaultActiveKey={['1']} ghost expandIconPosition="end">
                                            <Panel header={<span style={{fontWeight: 'bold'}}>Başvuru Formu Cevapları</span>} key="1">
                                                <List
                                                    itemLayout="vertical"
                                                    dataSource={mockStudentDetails.formAnswers}
                                                    renderItem={(item, index) => (
                                                        <List.Item style={{padding: '10px 0'}}>
                                                            <List.Item.Meta
                                                                title={<Text strong style={{fontSize: 13}}>{index + 1}. {item.question}</Text>}
                                                                description={<div style={{padding: '8px', background: '#fff', border:'1px solid #eee', borderRadius: 4, color: '#444'}}>{item.answer}</div>}
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            </Panel>
                                        </Collapse>
                                    </div>
                                )
                            },
                            {
                                key: '2',
                                label: 'Seans Notları',
                                children: (
                                    <div>
                                        <div style={{marginBottom: 20, background: '#fffbe6', padding: 15, borderRadius: 8, border: '1px solid #ffe58f'}}>
                                            <Text strong><WarningOutlined /> Terapist Özel Notları</Text>
                                            <TextArea 
                                                rows={4} 
                                                value={noteInput}
                                                onChange={e => setNoteInput(e.target.value)}
                                                style={{marginTop: 8}} 
                                            />
                                            <div style={{textAlign: 'right', marginTop: 8}}>
                                                <Button type="primary" icon={<SaveOutlined />} onClick={saveNotes} style={{backgroundColor: PRIMARY_COLOR}}>Notu Kaydet</Button>
                                            </div>
                                        </div>
                                        <Divider orientation="left">Geçmiş Seanslar</Divider>
                                        <Timeline>
                                            {mockStudentDetails.pastNotes.map((note, i) => (
                                                <Timeline.Item key={i} color="blue">
                                                    <Text strong>{note.sessionNo}. Seans </Text> 
                                                    <Text type="secondary" style={{fontSize: 12}}>({note.date})</Text>
                                                    <p style={{marginTop: 5}}>{note.note}</p>
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

            {/* YENİ SEANS EKLEME MODALI */}
            <Modal
                title="Yeni Seans Planla"
                open={isSessionModalOpen}
                onOk={saveNewSession}
                onCancel={() => setIsSessionModalOpen(false)}
                okText="Kaydet"
                cancelText="İptal"
            >
                {selectedAppointment && (
                    <p>
                        <b>{selectedAppointment.studentName}</b> için 
                        <Tag color="blue" style={{marginLeft: 5}}>{selectedAppointment.currentSessionCount + 1}. Seans</Tag> 
                        oluşturulacak.
                    </p>
                )}
                <FormLayout />
            </Modal>

            {/* --- YENİ EKLENEN: GRUP OLUŞTURMA MODALI (Analiz Uygun) --- */}
            <Modal
                title="Yeni Grup Çalışması Oluştur"
                open={isGroupModalOpen}
                onCancel={() => setIsGroupModalOpen(false)}
                footer={null}
            >
                <Form form={groupForm} layout="vertical" onFinish={handleSaveGroup}>
                    <Form.Item name="groupName" label="Hangi Grup Çalışması" rules={[{ required: true, message: 'Grup seçimi zorunludur' }]}>
                        <Select placeholder="Seçiniz veya Yazınız" showSearch allowClear>
                            <Option value="Sosyal Beceri Grubu">Sosyal Beceri Grubu</Option>
                            <Option value="Anksiyete ile Baş Etme">Anksiyete ile Baş Etme</Option>
                            <Option value="Yas Süreci Grubu">Yas Süreci Grubu</Option>
                            <Option value="Grup Çalışması Önerilmedi">Grup Çalışması Önerilmedi</Option>
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="startDate" label="Grup Başlama Tarihi">
                                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="endDate" label="Grup Bitiş Tarihi">
                                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="sessionCount" label="Grup Oturum Sayısı">
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="completionStatus" label="Bitiş Şekli">
                                <Select placeholder="Durum Seç">
                                    <Option value="Planlanıyor">Planlanıyor</Option>
                                    <Option value="Devam Ediyor">Devam Ediyor</Option>
                                    <Option value="Tamamlandı">Tamamlandı</Option>
                                    <Option value="İptal Edildi">İptal Edildi</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: 10 }}>
                        <Button onClick={() => setIsGroupModalOpen(false)} style={{ marginRight: 8 }}>İptal</Button>
                        <Button type="primary" htmlType="submit">Kaydet</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

// Basit form bileşeni
const FormLayout = () => (
    <div style={{marginTop: 20}}>
        <div style={{marginBottom: 10}}>Tarih:</div>
        <DatePicker style={{width: '100%', marginBottom: 15}} />
        <div style={{marginBottom: 10}}>Saat:</div>
        <Select style={{width: '100%', marginBottom: 15}} placeholder="Saat Seçiniz">
            <Option value="09:00">09:00</Option>
            <Option value="10:00">10:00</Option>
            <Option value="11:00">11:00</Option>
            <Option value="14:00">14:00</Option>
        </Select>
        <div style={{marginBottom: 10}}>Görüşme Türü:</div>
        <Select style={{width: '100%'}} defaultValue="yuz-yuze">
            <Option value="yuz-yuze">Yüz Yüze</Option>
            <Option value="online">Online</Option>
        </Select>
    </div>
);

export default TherapistDashboard;