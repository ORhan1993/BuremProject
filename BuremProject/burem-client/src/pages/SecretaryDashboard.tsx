import React, { useState, useEffect } from 'react';
import { 
    Layout, Card, Calendar, Badge, List, Button, Modal, Form, 
    Select, DatePicker, Input, Row, Col, Tag, Typography, Table, Space, message, Descriptions, Divider, Alert, Tabs, Statistic, Tooltip
} from 'antd';
import { 
    UserAddOutlined, SearchOutlined, CalendarOutlined, 
    TeamOutlined, ReloadOutlined, FilterOutlined, CheckCircleOutlined, 
    InfoCircleOutlined, ClockCircleOutlined, HomeOutlined, FileDoneOutlined, BellOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import type { CellRenderInfo } from 'rc-picker/lib/interface';
import agent from '../api/agent'; 

dayjs.locale('tr');

const { Title, Text } = Typography;
const { Option } = Select;

// --- KURUMSAL RENK PALETİ (Analiz Dokümanı Uyumu) ---
const COLORS = {
    primary: '#1e4a8b',    // Boğaziçi Mavisi
    secondary: '#8cc8ea',  // Açık Mavi
    success: '#52c41a',    // Yeşil (Onaylı/Atandı)
    warning: '#faad14',    // Sarı (Bekleyen)
    danger: '#f5222d',     // Kırmızı (Acil/Dolu)
    bg: '#f0f2f5'          // Arka Plan
};

const CARD_STYLE = { borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: 'none', height: '100%' };

// --- TİP TANIMLARI ---
interface PendingSession {
    id: number;
    name: string;
    studentNo: string;
    faculty: string;
    department: string;
    email: string;
    phone: string;
    classLevel: string;
    term: number;
    requestDate: string;
    status: string;
    applicationType: string; // "İlk Başvuru", "Tekrar Başvuru"
    kvkkApproved: boolean;
}

interface AppointmentDetail {
    id: number;
    studentName: string;
    therapistName: string;
    date: string;
    time: string;
    status: string;
    type: string;
}

interface TherapistAvailability {
    id: number;
    name: string;
    category: string;
    currentLoad: number;
    dailySlots: number;
    campus: string;
    workingDays: string[];
}

const SecretaryDashboard = () => {
    // --- STATE ---
    // Analiz : Menü yapısı için Tab state
    const [activeTab, setActiveTab] = useState('1'); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Veriler
    const [pendingStudents, setPendingStudents] = useState<PendingSession[]>([]);
    const [allAppointments, setAllAppointments] = useState<AppointmentDetail[]>([]);
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    
    // Filtreleme State'leri (Analiz [cite: 92-97])
    const [searchText, setSearchText] = useState("");
    const [facultyFilter, setFacultyFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    // Seçimler
    const [selectedStudent, setSelectedStudent] = useState<PendingSession | null>(null);
    const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(null);
    
    const [form] = Form.useForm();

    // --- VERİ ÇEKME ---
    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Bekleyen Başvurular
            if (agent.Sessions && agent.Sessions.getPending) {
                const pending = await agent.Sessions.getPending();
                setPendingStudents(pending);
            }
            // 2. Randevular
            if (agent.Appointments && agent.Appointments.getAll) {
                const appts = await agent.Appointments.getAll();
                setAllAppointments(appts);
            }
            // 3. Terapistler
            const tList = await agent.Appointments.getAvailableTherapists("Genel");
            setTherapists(tList);
        } catch (error) {
            console.error(error);
            message.error("Veri yükleme hatası. Lütfen sunucunun açık olduğundan emin olun.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // --- FİLTRELEME MANTIĞI (Analiz [cite: 92-97]) ---
    const filteredPending = pendingStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchText.toLowerCase()) || 
                              (student.studentNo && student.studentNo.includes(searchText));
        const matchesFaculty = facultyFilter ? student.faculty === facultyFilter : true;
        const matchesType = typeFilter ? student.applicationType === typeFilter : true;
        return matchesSearch && matchesFaculty && matchesType;
    });

    const handleOpenAssignModal = (student: PendingSession) => {
        setSelectedStudent(student);
        setSelectedTherapistId(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    // --- RANDEVU OLUŞTURMA (Analiz [cite: 122-129]) ---
    const handleOk = () => {
        form.validateFields().then(async (values) => {
            if (!selectedStudent) return;
            setLoading(true);
            
            // SecretaryDashboard.tsx -> handleOk fonksiyonu içine:

            const payload = {
                sessionId: selectedStudent.id,
                therapistId: values.therapistId,
                // Tarihi string'e çeviriyoruz. Örn: "2025-11-26"
                appointmentDate: values.date ? values.date.format('YYYY-MM-DD') : "", 
                appointmentHour: values.time,
                appointmentType: values.type,
                locationOrLink: values.locationOrLink || "BÜREM Ofis",
            };

            // Konsola yazdırıp kontrol edelim (F12 -> Console)
            console.log("Sunucuya Gönderilen Veri:", payload); 

            await agent.Appointments.create(payload);

            try {
                await agent.Appointments.create(payload);
                message.success("Randevu oluşturuldu ve öğrenciye e-posta gönderildi.");
                setIsModalOpen(false);
                loadData(); // Listeyi güncelle
                setActiveTab('3'); // "Atanmış Randevular" sekmesine geç
            } catch (error: any) {
                // Hata mesajını yakalama
                const errorMsg = error.response?.data?.message || "Randevu oluşturulamadı (400 Bad Request). Lütfen Backend DTO'sunu kontrol edin.";
                message.error(errorMsg);
            } finally {
                setLoading(false);
            }
        });
    };

    const selectedTherapistDetails = therapists.find(t => t.id === selectedTherapistId);

    // --- EKRAN TASARIMLARI ---

    // 1. Sekme: Yeni Başvurular (Analiz [cite: 90-97])
    const renderNewApplications = () => (
        <Card style={CARD_STYLE} title={<span><UserAddOutlined /> Yeni Başvurular Listesi</span>} extra={<Button icon={<ReloadOutlined/>} onClick={loadData}>Yenile</Button>}>
            
            {/* Filtre Barı (Analiz [cite: 92]) */}
            <div style={{ background: '#fafafa', padding: 15, borderRadius: 6, marginBottom: 15, border: '1px solid #f0f0f0' }}>
                <Row gutter={16} align="middle">
                    <Col span={8}>
                        <Input placeholder="Ad / Soyad / Öğrenci No Ara..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} />
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Fakülte Filtrele" allowClear style={{width:'100%'}} onChange={setFacultyFilter}>
                            <Option value="Eğitim Fakültesi">Eğitim Fakültesi</Option>
                            <Option value="Fen Edebiyat Fakültesi">Fen Edebiyat Fakültesi</Option>
                            <Option value="Mühendislik Fakültesi">Mühendislik Fakültesi</Option>
                            <Option value="İktisadi ve İdari Bilimler">İİBF</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Başvuru Tipi" allowClear style={{width:'100%'}} onChange={setTypeFilter}>
                            <Option value="İlk Başvuru">İlk Başvuru</Option>
                            <Option value="Tekrar Başvuru">Tekrar Başvuru</Option>
                        </Select>
                    </Col>
                    <Col span={4} style={{textAlign:'right'}}>
                        <Tag color="red" style={{fontSize:14, padding:'5px 10px'}}>Bekleyen: {filteredPending.length}</Tag>
                    </Col>
                </Row>
            </div>

            {/* Başvuru Tablosu (Analiz [cite: 91]) */}
            <Table 
                dataSource={filteredPending}
                rowKey="id"
                loading={loading}
                pagination={{pageSize: 8}}
                columns={[
                    { title: 'Başvuru No', dataIndex: 'id', width: 100 },
                    { title: 'Öğrenci Adı', dataIndex: 'name', render: (t,r) => <div><div style={{fontWeight:'bold'}}>{t}</div><div style={{fontSize:11, color:'#888'}}>{r.studentNo}</div></div> },
                    { title: 'Fakülte', dataIndex: 'faculty' },
                    { title: 'Tarih', dataIndex: 'requestDate' },
                    { title: 'Tür', dataIndex: 'applicationType', render: t => <Tag color={t==='İlk Başvuru'?'blue':'orange'}>{t}</Tag> },
                    { title: 'Durum', dataIndex: 'status', render: t => <Tag color="warning">Atama Bekliyor</Tag> },
                    { 
                        title: 'İşlem', key: 'action', 
                        render: (_, r) => (
                            <Button type="primary" size="small" onClick={() => handleOpenAssignModal(r)}>
                                İncele & Ata
                            </Button>
                        ) 
                    }
                ]}
            />
        </Card>
    );

    // 2. Sekme: Takvim Görünümü (Analiz [cite: 195])
    const renderCalendar = () => {
        const cellRender = (current: Dayjs, info: CellRenderInfo<Dayjs>) => {
            if (info.type === 'date') {
                const listData = allAppointments.filter(x => x.date === current.format('DD.MM.YYYY'));
                return (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {listData.map((item) => (
                            <li key={item.id}><Badge status={item.status === 'Completed' ? 'success' : 'processing'} text={item.time} /></li>
                        ))}
                    </ul>
                );
            }
            return info.originNode;
        };
        return (
            <Card style={CARD_STYLE} title={<span><CalendarOutlined /> Terapist Genel Takvimi</span>}>
                <Alert message="Mavi: Planlı Randevular | Yeşil: Tamamlanmış Randevular" type="info" showIcon style={{marginBottom:15}}/>
                <Calendar cellRender={cellRender} />
            </Card>
        );
    };

    // 3. Sekme: Atanmış Randevular (Analiz [cite: 86])
    const renderAppointments = () => (
        <Card style={CARD_STYLE} title={<span><TeamOutlined /> Atanmış Randevular Listesi</span>}>
            <Table 
                dataSource={allAppointments}
                rowKey="id"
                columns={[
                    { title: 'Tarih', dataIndex: 'date' },
                    { title: 'Saat', dataIndex: 'time' },
                    { title: 'Öğrenci', dataIndex: 'studentName', render: t => <b>{t}</b> },
                    { title: 'Terapist', dataIndex: 'therapistName' },
                    { title: 'Tür', dataIndex: 'type', render: t => t === 'Online' ? <Tag color="cyan">Online</Tag> : <Tag color="purple">Yüz Yüze</Tag> },
                    { title: 'Durum', dataIndex: 'status', render: t => <Tag color={t==='Completed'?'green':'processing'}>{t}</Tag> }
                ]}
            />
        </Card>
    );

    return (
        <div style={{ padding: 24, fontFamily: 'Helvetica, Arial, sans-serif', background: COLORS.bg, minHeight: '100vh' }}>
            
            {/* ÜST BAR (Analiz [cite: 135]) */}
            <div style={{ marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 8, borderLeft: `5px solid ${COLORS.primary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div>
                    <Title level={3} style={{ margin: 0, color: COLORS.primary }}>Sekreter Paneli</Title>
                    <Text type="secondary">Randevu yönlendirme ve başvuru yönetim ekranı.</Text>
                </div>
                <div style={{textAlign: 'right'}}>
                    <Space size="large">
                        <Badge dot><BellOutlined style={{fontSize:20, cursor:'pointer'}}/></Badge>
                        <Text strong style={{fontSize:16}}>{dayjs().format('DD MMMM YYYY, dddd')}</Text>
                    </Space>
                </div>
            </div>

            {/* SEKMELER (Analiz  Sol Menü İşlevi) */}
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                type="card"
                size="large"
                style={{marginBottom: 20}}
                items={[
                    { key: '1', label: <span><UserAddOutlined /> Yeni Başvurular <Badge count={pendingStudents.length} style={{marginLeft:5, backgroundColor: COLORS.danger}} /></span>, children: renderNewApplications() },
                    { key: '2', label: <span><ClockCircleOutlined /> Atama Bekleyenler</span>, children: renderNewApplications() }, // Aynı ekranı kullanır
                    { key: '3', label: <span><TeamOutlined /> Atanmış Randevular</span>, children: renderAppointments() },
                    { key: '4', label: <span><CalendarOutlined /> Terapist Takvimi</span>, children: renderCalendar() },
                    { key: '5', label: <span><FileDoneOutlined /> Arşiv</span>, children: <Card style={CARD_STYLE}><Alert message="Tamamlanan süreçler burada listelenir." type="info"/></Card> }
                ]}
            />

            {/* --- BAŞVURU İNCELEME VE ATAMA MODALI (Analiz [cite: 98-129]) --- */}
            <Modal
                title={<div style={{color: COLORS.primary, fontSize: 18, borderBottom:`1px solid ${COLORS.secondary}`, paddingBottom:10}}>Başvuru İnceleme ve Yönlendirme</div>}
                open={isModalOpen}
                confirmLoading={loading}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleOk}
                okText="Randevu Oluştur ve Bildir"
                cancelText="İptal"
                width={850}
                style={{top: 20}}
            >
                <Form form={form} layout="vertical">
                    
                    {/* ÖĞRENCİ BİLGİLERİ KARTI (Analiz [cite: 100-108]) */}
                    <div style={{background: '#f9fcff', padding: 20, borderRadius: 8, marginBottom: 20, border: `1px solid ${COLORS.secondary}`}}>
                        <Descriptions 
                            title={<span style={{color: COLORS.primary}}>📌 Öğrenci Bilgileri Kartı</span>} 
                            bordered 
                            size="small" 
                            column={2} 
                            styles={{ label: { fontWeight: 'bold', width: '150px' } }}
                        >
                            <Descriptions.Item label="Ad Soyad">{selectedStudent?.name}</Descriptions.Item>
                            <Descriptions.Item label="Öğrenci No">{selectedStudent?.studentNo}</Descriptions.Item>
                            <Descriptions.Item label="Fakülte/Bölüm">{selectedStudent?.faculty} / {selectedStudent?.department}</Descriptions.Item>
                            <Descriptions.Item label="Sınıf/Dönem">{selectedStudent?.classLevel} / {selectedStudent?.term}. Dönem</Descriptions.Item>
                            <Descriptions.Item label="Telefon">{selectedStudent?.phone}</Descriptions.Item>
                            <Descriptions.Item label="E-posta">{selectedStudent?.email}</Descriptions.Item>
                            <Descriptions.Item label="KVKK & Onam">
                                {selectedStudent?.kvkkApproved ? <Tag icon={<CheckCircleOutlined />} color="success">Onaylı</Tag> : <Tag color="red">Onaysız</Tag>}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    <Divider orientation="left" style={{color: COLORS.primary, borderColor: COLORS.primary}}>Terapiste Yönlendir</Divider>

                    {/* ADIM 1: TERAPİST SEÇİMİ (Analiz [cite: 111-119]) */}
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item name="therapistId" label="Adım 1: Terapist Seçimi" rules={[{required:true, message:'Zorunlu'}]}>
                                <Select 
                                    placeholder="Uzman Seçiniz" 
                                    loading={loading}
                                    onChange={(val) => setSelectedTherapistId(val)}
                                    size="large"
                                >
                                    {therapists.map(t => (
                                        <Option key={t.id} value={t.id}>
                                            {t.name} ({t.category})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            
                            {/* TERAPİST DURUM KARTI (Analiz [cite: 118]) */}
                            {selectedTherapistDetails && (
                                <div style={{background: '#f6ffed', border: '1px solid #b7eb8f', padding: 12, borderRadius: 6, fontSize: 13, marginBottom: 15}}>
                                    <div style={{fontWeight: 'bold', color: '#389e0d', marginBottom: 8, display:'flex', alignItems:'center'}}>
                                        <InfoCircleOutlined style={{marginRight:5}}/> Terapist Müsaitlik Durumu
                                    </div>
                                    <Row gutter={[0, 8]}>
                                        <Col span={12}><HomeOutlined /> <b>Kampüs:</b> {selectedTherapistDetails.campus}</Col>
                                        <Col span={12}><ClockCircleOutlined /> <b>Boş Slot:</b> {selectedTherapistDetails.dailySlots}</Col>
                                        <Col span={12}><TeamOutlined /> <b>Aktif Yük:</b> {selectedTherapistDetails.currentLoad} Vaka</Col>
                                        <Col span={12}><CalendarOutlined /> <b>Günler:</b> {selectedTherapistDetails.workingDays.join(', ')}</Col>
                                    </Row>
                                </div>
                            )}
                        </Col>
                        
                        <Col span={12}>
                            <Form.Item name="type" label="Görüşme Türü" rules={[{required:true, message:'Zorunlu'}]}>
                                <Select placeholder="Seçiniz" size="large">
                                    <Option value="Yüz Yüze">Yüz Yüze</Option>
                                    <Option value="Online">Online</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* ADIM 2: TARİH VE SAAT (Analiz [cite: 120-121]) */}
                    <div style={{background: '#fffbe6', padding: 15, borderRadius: 6, border:'1px solid #ffe58f', marginBottom: 15}}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="date" label="Adım 2: Tarih Seçimi" rules={[{required:true, message:'Zorunlu'}]} style={{marginBottom:0}}>
                                    <DatePicker style={{width:'100%'}} format="DD.MM.YYYY" placeholder="Gün Seçiniz" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="time" label="Saat (Slot)" rules={[{required:true, message:'Zorunlu'}]} style={{marginBottom:0}}>
                                    <Select placeholder="Saat Seçiniz">
                                        <Option value="09:00">09:00</Option><Option value="10:00">10:00</Option>
                                        <Option value="11:00">11:00</Option><Option value="13:00">13:00</Option>
                                        <Option value="14:00">14:00</Option><Option value="15:00">15:00</Option>
                                        <Option value="16:00">16:00</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>
                    
                    {/* ADIM 3: YER BİLGİSİ (Analiz [cite: 128]) */}
                    <Form.Item name="locationOrLink" label="Adım 3: Oda veya Online Link" rules={[{required:true, message:'Zorunlu'}]}>
                         <Input placeholder="Örn: Kuzey Kampüs Oda 101 veya Zoom Linki" prefix={<HomeOutlined style={{color: 'gray'}}/>} size="large" />
                    </Form.Item>

                    <Alert 
                        message="Bilgilendirme:" 
                        description="Kaydet butonuna bastığınızda, sistem öğrenciye otomatik olarak randevu bilgilerini içeren e-posta gönderecek ve terapistin takvimine işleyecektir." 
                        type="warning" 
                        showIcon 
                        style={{fontSize: 12}} 
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default SecretaryDashboard;