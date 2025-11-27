import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Layout, Menu, Table, Button, Modal, Form, Input, Tabs, message, 
    Card, Select, Popconfirm, Tag, Space, Row, Col, Statistic, 
    DatePicker, Tooltip, InputNumber, Descriptions, Spin, Radio,Switch, Drawer, Collapse, Alert, Typography, 
    Divider, Calendar, List, Badge, Avatar, Popover, Timeline, Checkbox, Steps
} from 'antd';
import { 
    FormOutlined, PlusOutlined, DeleteOutlined, 
    EditOutlined, UserOutlined, TeamOutlined, SearchOutlined, 
    DashboardOutlined, SolutionOutlined, 
    EyeOutlined, ClearOutlined, ArrowLeftOutlined,
    FileTextOutlined, FileDoneOutlined, DownloadOutlined, 
    SaveOutlined, UserAddOutlined, 
    MenuUnfoldOutlined, MenuFoldOutlined,
    BookOutlined, PhoneOutlined, LockOutlined, CalendarOutlined, CheckCircleOutlined,
    AppstoreOutlined, GlobalOutlined, SafetyCertificateOutlined,
    MedicineBoxOutlined, HistoryOutlined, RightOutlined, 
    ClockCircleOutlined, AlertOutlined, FileProtectOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import dayjs from 'dayjs'; 
import 'dayjs/locale/tr';

// --- KRİTİK: TYPE IMPORTLARI AYRILDI ---
import agent from '../../api/agent';
import type { 
    StudentProfileDetail, 
    Question, 
    SiteContent, 
    TherapistAvailability,
    StudentSession,
    FormAnswer,
    PastNote
} from '../../api/agent';

import AppointmentModal from '../../components/AppointmentModal';

dayjs.locale('tr');

const { Header, Content, Sider } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Title, Text } = Typography;

// --- STİL TANIMLARI ---
const PRIMARY_COLOR = '#1e4a8b'; 
const SECONDARY_COLOR = '#8cc8ea'; 
const BOUN_FONT = 'Helvetica, Arial, sans-serif'; 
const BORDER_COLOR = '#dcebf7';
const CARD_SHADOW = '0 4px 12px rgba(30, 74, 139, 0.08)';
const BORDER_RADIUS = 8;

const cardStyle = {
    borderRadius: BORDER_RADIUS,
    boxShadow: CARD_SHADOW,
    border: `1px solid ${BORDER_COLOR}`,
    marginBottom: 24,
    fontFamily: BOUN_FONT
};

const sectionHeaderStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderLeft: `4px solid ${PRIMARY_COLOR}`,
    color: PRIMARY_COLOR,
    padding: '16px 20px',
    marginBottom: '24px',
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: BOUN_FONT,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    borderRadius: '0 8px 8px 0'
};

const sessionStyles = {
    infoRow: { display: 'flex', marginBottom: '12px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '6px', overflow: 'hidden' },
    labelBox: { backgroundColor: '#fafafa', padding: '10px 15px', width: '160px', borderRight: `1px solid ${BORDER_COLOR}`, display: 'flex', alignItems: 'center', fontWeight: 600, color: '#444', fontSize: '13px', fontFamily: BOUN_FONT },
    valueBox: { padding: '10px 15px', flex: 1, backgroundColor: '#fff', display: 'flex', alignItems: 'center', minHeight: '44px', fontSize: '14px', color: '#333', fontFamily: BOUN_FONT },
    questionCard: { display: 'flex', flexDirection: 'column' as const, backgroundColor: '#fff', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    questionText: { padding: '16px 20px', borderBottom: `1px solid ${BORDER_COLOR}`, color: PRIMARY_COLOR, fontSize: '15px', fontWeight: 600, backgroundColor: '#fdfdfd', fontFamily: BOUN_FONT },
    answerContainer: { padding: '16px 20px', backgroundColor: '#fff' }
};

const quillModules = { 
    toolbar: [ 
        [{ 'header': [1, 2, 3, false] }], 
        ['bold', 'italic', 'underline'], 
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
        ['link', 'clean'] 
    ] 
};

const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div style={sessionStyles.infoRow}>
        <div style={sessionStyles.labelBox}>{label}</div>
        <div style={sessionStyles.valueBox}>{value}</div>
    </div>
);

// --- YARDIMCI FONKSİYON: GÜVENLİ TARİH FORMATLAMA ---
// "Invalid Date" hatasını önlemek için bu fonksiyonu kullanıyoruz.
const safeDateFormat = (dateString: string | undefined | null, format = 'DD.MM.YYYY') => {
    if (!dateString) return '-';
    const d = dayjs(dateString);
    // Eğer geçerli bir tarihse formatla, değilse (örn: zaten formatlıysa) olduğu gibi göster
    return d.isValid() ? d.format(format) : dateString;
};

// ============================================================================
// 1. DASHBOARD MODULE
// ============================================================================
const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        agent.Stats.getDashboard()
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => {
                message.error("İstatistik verileri yüklenemedi.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{padding:50, textAlign:'center'}}><Spin size="large" tip="Yükleniyor..." /></div>;
    
    return (
        <div style={{ animation: 'fadeIn 0.5s', fontFamily: BOUN_FONT }}>
            <div style={sectionHeaderStyle}><DashboardOutlined /> Genel Durum Paneli</div>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}><Card bordered={false} style={cardStyle}><Statistic title="Toplam Öğrenci" value={stats?.totalStudents || 0} prefix={<UserOutlined style={{color: PRIMARY_COLOR}} />} valueStyle={{color: PRIMARY_COLOR, fontFamily: BOUN_FONT}} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card bordered={false} style={cardStyle}><Statistic title="Toplam Başvuru" value={stats?.totalSessions || 0} prefix={<FileTextOutlined style={{color: '#722ed1'}} />} valueStyle={{color: '#722ed1', fontFamily: BOUN_FONT}} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card bordered={false} style={cardStyle}><Statistic title="Bugünkü Görüşmeler" value={stats?.todaySessions || 0} prefix={<CalendarOutlined style={{color: '#52c41a'}} />} valueStyle={{color: '#52c41a', fontFamily: BOUN_FONT}} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card bordered={false} style={cardStyle}><Statistic title="Bekleyen Formlar" value={stats?.pendingForms || 0} prefix={<FileDoneOutlined style={{color: '#faad14'}} />} valueStyle={{color: '#faad14', fontFamily: BOUN_FONT}} /></Card></Col>
            </Row>
            <Alert message={<span style={{fontFamily: BOUN_FONT, fontWeight: 'bold'}}>Hoş Geldiniz</span>} description="Sol menüyü kullanarak işlemleri gerçekleştirebilirsiniz." type="info" showIcon style={{ marginTop: 10, borderRadius: 8, border: `1px solid ${SECONDARY_COLOR}`, backgroundColor: '#e6f7ff' }} />
        </div>
    );
};

// ============================================================================
// 2. TERAPİST PANELİ
// ============================================================================
const TherapistDashboard = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [studentDetail, setStudentDetail] = useState<StudentProfileDetail | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        agent.Sessions.getTherapistAppointments()
            .then(data => { setAppointments(data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleOpenDrawer = async (appointment: any) => {
        setSelectedAppointment(appointment);
        try {
            const detail = await agent.Students.getById(Number(appointment.studentId)); 
            setStudentDetail(detail);
            setDrawerVisible(true);
        } catch { message.error("Detaylar alınamadı."); }
    };

    const columns = [
        { title: 'Saat', dataIndex: 'time', width: 80, render: (t:any) => <Tag color="blue" style={{fontSize: 14}}>{t}</Tag> },
        { title: 'Danışan', dataIndex: 'studentName', render: (text: string, r: any) => (<Space><Avatar style={{backgroundColor: SECONDARY_COLOR}} icon={<UserOutlined />} /><div><div style={{fontWeight: 600, color: PRIMARY_COLOR}}>{text}</div><div style={{fontSize: '11px', color: '#888'}}>{r.studentId}</div></div></Space>) },
        { title: 'Görüşme Tipi', dataIndex: 'type', render: (t: string) => <Tag color={t === 'Online' ? 'purple' : 'geekblue'}>{t}</Tag> },
        { title: 'Notlar', dataIndex: 'note', ellipsis: true, render: (t:string) => <Text type="secondary" style={{fontSize:12}}>{t}</Text> },
        { title: 'Durum', dataIndex: 'status', render: (s: string) => <Badge status={s==='active'?'processing':'success'} text={s==='active'?'Bekleniyor':s} /> },
        { title: 'İşlem', render: (_: any, r: any) => (<Button type="primary" size="small" onClick={() => handleOpenDrawer(r)} style={{backgroundColor: PRIMARY_COLOR, borderRadius: 4}}>Dosyayı Aç <RightOutlined /></Button>) }
    ];

    return (
        <div style={{ fontFamily: BOUN_FONT }}>
            <Row gutter={[16, 16]} style={{marginBottom: 24}}>
                <Col span={18}>
                    <Alert message={<span style={{fontWeight:'bold', fontSize:16}}>Günaydın, Psk. Ayşe Yılmaz</span>} description={`Bugün toplam ${appointments.length} randevunuz var.`} type="info" showIcon icon={<ClockCircleOutlined style={{fontSize: 24, color: PRIMARY_COLOR}}/>} style={{border: `1px solid ${SECONDARY_COLOR}`, backgroundColor: '#e6f7ff', height: '100%', display:'flex', alignItems:'center'}} />
                </Col>
                <Col span={6}>
                    <Card style={{...cardStyle, marginBottom: 0, textAlign:'center', background: '#fff3f3', borderColor: '#ffa39e'}}>
                        <Statistic title="Acil Durum / Riskli Danışan" value={1} prefix={<AlertOutlined style={{color: 'red'}} />} valueStyle={{color: 'red', fontSize: 20}} />
                    </Card>
                </Col>
            </Row>
            <div style={sectionHeaderStyle}><MedicineBoxOutlined /> Randevu Takvimi & Dosyalar</div>
            <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
                <Tabs defaultActiveKey="1" type="card" size="large" tabBarStyle={{ margin: 0, padding: '10px 10px 0 10px', background: '#fafafa' }} items={[
                    { key: '1', label: <span><CalendarOutlined /> Bugünkü Program</span>, children: <Table dataSource={appointments} columns={columns} rowKey="id" pagination={false} style={{padding: 20}} loading={loading} /> },
                    { key: '2', label: <span><HistoryOutlined /> Geçmiş Görüşmeler</span>, children: <div style={{padding:20, textAlign:'center'}}>Geçmiş veriler...</div> }
                ]} />
            </Card>
            <Drawer title={<Space><FileProtectOutlined style={{color: PRIMARY_COLOR}}/> <span style={{color: PRIMARY_COLOR, fontSize: 18, fontWeight: 'bold'}}>Danışan Dosyası İnceleme</span></Space>} placement="right" width={850} onClose={() => {setDrawerVisible(false); setStudentDetail(null);}} open={drawerVisible} headerStyle={{backgroundColor: '#f0f2f5', borderBottom: `2px solid ${PRIMARY_COLOR}`}}>
                {studentDetail && (
                    <div style={{fontFamily: BOUN_FONT}}>
                        <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24, border: '1px solid #d9d9d9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <Row align="middle" gutter={24}>
                                <Col><Avatar size={80} style={{ backgroundColor: PRIMARY_COLOR, fontSize: 32 }}>{studentDetail.firstName.charAt(0)}</Avatar></Col>
                                <Col flex="auto">
                                    <Title level={3} style={{ margin: 0, color: '#333' }}>{studentDetail.firstName} {studentDetail.lastName}</Title>
                                    <Text type="secondary" style={{fontSize: 16}}>{studentDetail.studentNo} | {studentDetail.department}</Text>
                                    <div style={{ marginTop: 12 }}>
                                        <Tag color="red" style={{padding: '4px 10px', fontSize: 13}}>Risk: {studentDetail.riskLevel || 'Bilinmiyor'}</Tag>
                                        <Tag color="blue" style={{padding: '4px 10px', fontSize: 13}}>{studentDetail.isScholar || 'Burs Bilgisi Yok'}</Tag>
                                    </div>
                                </Col>
                                <Col><Button type="primary" size="large" style={{backgroundColor: '#52c41a', borderColor: '#52c41a'}} icon={<ClockCircleOutlined />}>Seansı Başlat</Button></Col>
                            </Row>
                            <Divider style={{margin: '20px 0'}} />
                            <Descriptions column={2} size="middle" labelStyle={{fontWeight:'bold', color: PRIMARY_COLOR}}>
                                <Descriptions.Item label="Sınıf">{studentDetail.grade || '-'}</Descriptions.Item>
                                <Descriptions.Item label="GPA">{studentDetail.gpa || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Telefon">{studentDetail.mobilePhone}</Descriptions.Item>
                                <Descriptions.Item label="Acil Durum">{studentDetail.contactPerson}</Descriptions.Item>
                            </Descriptions>
                        </div>
                        <Tabs defaultActiveKey="1" type="line" items={[
                            { 
                                key: '1', label: <span style={{fontSize:15}}><SolutionOutlined/> Başvuru Formu</span>, 
                                children: (
                                    <div style={{paddingTop: 10}}>
                                        <Collapse defaultActiveKey={['1']} expandIconPosition="end">
                                            <Panel header={<span style={{fontWeight: 'bold', color: PRIMARY_COLOR}}>Form Cevapları</span>} key="1">
                                                <List itemLayout="vertical" dataSource={studentDetail.formAnswers || []} renderItem={(item: FormAnswer, index: number) => (
                                                    <List.Item style={{padding: '12px 0'}}><List.Item.Meta title={<Text strong style={{fontSize: 14}}>{index + 1}. {item.question}</Text>} description={<div style={{padding: '10px', background: '#f4f8fc', borderRadius: 6, color: '#333', marginTop: 5, border: `1px solid ${BORDER_COLOR}`}}>{item.answer}</div>} /></List.Item>
                                                )} />
                                            </Panel>
                                            <Panel header={<span style={{fontWeight: 'bold', color: PRIMARY_COLOR}}>Akademik Geçmiş (OBS)</span>} key="2"><p>OBS entegrasyonu...</p></Panel>
                                        </Collapse>
                                    </div>
                                ) 
                            },
                            { 
                                key: '2', label: <span style={{fontSize:15}}><FileTextOutlined/> Klinik Notlar</span>, 
                                children: (
                                    <div style={{paddingTop: 10}}>
                                        <div style={{marginBottom: 25, background: '#fffbe6', padding: 20, borderRadius: 8, border: '1px solid #ffe58f'}}>
                                            <Text strong style={{fontSize: 16, display:'block', marginBottom: 10}}>📝 Yeni Not:</Text>
                                            <TextArea rows={6} style={{marginBottom: 10}} />
                                            <Space><Checkbox>Özel Not</Checkbox><Checkbox>Risk Bildirimi</Checkbox></Space>
                                            <div style={{textAlign: 'right', marginTop: 10}}><Button type="primary" icon={<SaveOutlined />} style={{backgroundColor: PRIMARY_COLOR}}>Kaydet</Button></div>
                                        </div>
                                        <Timeline mode="left">
                                            {studentDetail.pastNotes?.map((note: PastNote, i: number) => (
                                                <Timeline.Item key={i} color="blue" label={note.date}>
                                                    <Card size="small" title={note.type} extra={<Text type="secondary" style={{fontSize:11}}>{note.author}</Text>} style={{marginBottom: 10}}><p>{note.note}</p></Card>
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

// ============================================================================
// 3. SEKRETER PANELİ
// ============================================================================
const SecretaryDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentName, setSelectedStudentName] = useState('');
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => { 
        agent.Students.getPending().then(data => setPendingStudents(data || []));
        agent.Appointments.getSchedule().then(data => setSchedule(data || []));
    }, []);

    const dateCellRender = (value: any) => {
        const listData = schedule.filter(x => x.date === value.format('YYYY-MM-DD'));
        return (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {listData.map((item, index) => (
                    <li key={index}>
                        <Popover title={<span style={{color: PRIMARY_COLOR}}>{item.content}</span>} content={<div><p><b>Öğrenci:</b> {item.student}</p><p><b>Not:</b> {item.note}</p><p><b>Süre:</b> {item.duration}</p></div>}>
                            <Badge status={item.type as any} text={item.content} style={{fontSize: 10, cursor: 'pointer'}} />
                        </Popover>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div style={{ fontFamily: BOUN_FONT }}>
            <div style={sectionHeaderStyle}><CalendarOutlined /> Sekreter Randevu Yönetimi</div>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card title={<span style={{color: PRIMARY_COLOR}}><UserAddOutlined /> Bekleyen Başvurular</span>} style={cardStyle} extra={<Tag color="red">{pendingStudents.length}</Tag>}>
                        <List itemLayout="horizontal" dataSource={pendingStudents} renderItem={(item) => (
                            <List.Item actions={[<Button type="primary" size="small" onClick={()=>{setSelectedStudentName(item.name); setIsModalOpen(true);}} style={{backgroundColor: SECONDARY_COLOR, borderColor: SECONDARY_COLOR}}>Randevu Ver</Button>]}>
                                <List.Item.Meta avatar={<div style={{width:36, height:36, background: SECONDARY_COLOR, borderRadius: '50%', display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontWeight:'bold'}}>{item.name.charAt(0)}</div>} title={<Text strong>{item.name}</Text>} description={<div><div style={{fontSize: 11}}>{item.department}</div><div style={{fontSize: 10, color: '#888'}}>{item.requestDate}</div></div>} />
                            </List.Item>
                        )} />
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title={<span style={{color: PRIMARY_COLOR}}><CalendarOutlined /> Terapist Doluluk Takvimi</span>} style={cardStyle}>
                        <Calendar dateCellRender={dateCellRender} fullscreen={false} />
                    </Card>
                </Col>
            </Row>
            <AppointmentModal visible={isModalOpen} onCancel={() => setIsModalOpen(false)} studentName={selectedStudentName} sessionId={0} />
        </div>
    );
};

// ============================================================================
// 4. SESSION DETAIL MODÜLÜ (BEYAZ SAYFA & TARİH HATASI ÇÖZÜLDÜ)
// ============================================================================
// AdminPanel.tsx içindeki SessionDetailModule bileşenini tamamen bununla değiştirin:

const SessionDetailModule = ({ sessionId, mode = 'view', onBack }: { sessionId: number, mode?: 'view' | 'edit' | 'feedback', onBack: () => void }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null); // Tip any yapıldı hata almamak için
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [localMode, setLocalMode] = useState(mode);

    // 1. Veriyi çek
    useEffect(() => { 
        if (sessionId) loadData(sessionId); 
    }, [sessionId]);

    // 2. Veri geldiyse ve form render olduysa değerleri doldur (useForm hatasını çözer)
    useEffect(() => {
        if (sessionData && !loading) {
            const formValues: any = {};
            if (sessionData.answers) { 
                sessionData.answers.forEach((ans: any) => { 
                    formValues[`q_${ans.questionId}`] = ans.answerValue; 
                }); 
            }
            form.setFieldsValue(formValues);
        }
    }, [sessionData, loading, form]);

    const loadData = async (sId: number) => {
        try {
            setLoading(true);
            const data = await agent.Sessions.getById(sId); 
            setSessionData(data);
            // Burada form.setFieldsValue YAPMIYORUZ, useEffect hallediyor.
        } catch { 
            message.error("Veri yüklenemedi"); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async (values: any) => {
        if (!sessionData) return;
        setLoading(true);
        try {
            const apiPayload = Object.keys(values).map(key => {
                if (!key.startsWith('q_')) return null;
                const qId = parseInt(key.split('_')[1]); 
                return { questionId: qId, value: values[key] };
            }).filter(x => x !== null);
            await agent.Sessions.update(sessionData.sessionId, apiPayload);
            message.success("Değişiklikler kaydedildi."); setLocalMode('view');
        } catch { message.error("Kaydetme hatası"); } finally { setLoading(false); }
    };

    if (loading) return <div style={{textAlign:'center', padding:50}}><Spin size="large" tip="Yükleniyor..." /></div>;
    if (!sessionData) return <Alert message="Kayıt Bulunamadı" type="error" showIcon />;

    const isEdit = localMode === 'edit';
    const isFeedback = localMode === 'feedback';

    return (
        <div style={{ animation: 'fadeIn 0.3s', fontFamily: BOUN_FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ fontSize: 16, fontWeight: 600 }}>Geri Dön</Button>
                <Tag color={isEdit ? "processing" : "success"} style={{fontSize: 14, padding: '5px 10px'}}>{isEdit ? "Düzenleme Modu" : (isFeedback ? "Değerlendirme Modu" : "Görüntüleme Modu")}</Tag>
            </div>

            <Card style={cardStyle} title={<Space><UserOutlined style={{color: PRIMARY_COLOR}}/> <span style={{color: PRIMARY_COLOR}}>Başvuru Künyesi</span></Space>}>
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <InfoRow label="Öğrenci" value={<Text strong>{sessionData.studentName}</Text>} />
                        <InfoRow label="Öğrenci No" value={sessionData.studentNumber || "---"} />
                        <InfoRow label="Başvuru Tarihi" value={sessionData.sessionDate} />
                         <InfoRow label="Yerleşke" value={
                            <Select defaultValue="Sarıtepe Yerleşkesi" variant="borderless" style={{ width: '100%', marginLeft: -10 }} disabled={!isEdit}>
                                <Option value="Kuzey">Kuzey Kampüs</Option>
                                <Option value="Sarıtepe Yerleşkesi">Sarıtepe Yerleşkesi</Option>
                            </Select>
                        } />
                    </Col>
                    <Col xs={24} md={12}>
                        <InfoRow label="Ön Görüşme Yapan" value="Başak Yılmaz" />
                        {/* Advisor Name Düzeltmesi */}
                        <InfoRow label="Atanan Danışman" value={sessionData.advisorName && sessionData.advisorName !== "Atanmamış" ? <Tag color="blue">{sessionData.advisorName}</Tag> : <Tag color="orange">Atanmamış</Tag>} />
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            {!isFeedback && (
                                <Space>
                                    <Button style={{ borderColor: '#52c41a', color: '#52c41a' }} icon={<UserAddOutlined />} onClick={() => setIsAppointmentModalOpen(true)}>Terapiste Yönlendir</Button>
                                    {!isEdit ? 
                                        <Button type="primary" ghost icon={<EditOutlined />} onClick={() => setLocalMode('edit')}>Formu Düzenle</Button> 
                                        : 
                                        <Button icon={<FileTextOutlined />} onClick={() => setLocalMode('view')}>İptal</Button>
                                    }
                                </Space>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>

            <Form form={form} onFinish={handleSave} disabled={!isEdit && !isFeedback} layout="vertical">
                {sessionData.answers && sessionData.answers.length > 0 ? (
                    sessionData.answers.map((q: any) => {
                        // Güvenli veri kontrolü
                        const hasOptions = q.options && q.options.length > 0;
                        const currentAnswer = form.getFieldValue(`q_${q.questionId}`);
                        const isNumericAnswer = ["0","1","2","3"].includes(String(currentAnswer));
                        
                        // Likert ve Dropdown mantığı
                        const isLikert = (hasOptions && q.options.some((opt:any) => ["0", "1", "2", "3"].includes(opt.label?.trim()))) || (!hasOptions && isNumericAnswer);
                        
                        const displayOptions = (isLikert && !hasOptions) 
                            ? [ { label: "0", value: "0" }, { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "Yok", value: "Cevap Yok" } ] 
                            : (q.options || []);
                            
                        const isDropdown = hasOptions && !isLikert;
                        const isText = !isLikert && !isDropdown;
                        
                        return (
                            <div key={q.questionId} style={sessionStyles.questionCard}>
                                <div style={sessionStyles.questionText}>{q.questionTitle || "Soru Başlığı Yok"}</div>
                                <div style={sessionStyles.answerContainer}>
                                    <Form.Item name={`q_${q.questionId}`} style={{ marginBottom: 0 }}>
                                        {isLikert && ( 
                                            // RADIO IMPORT HATASINI ÇÖZEN KISIM
                                            <Radio.Group>
                                                <Space wrap>
                                                    {displayOptions.map((opt: any) => (
                                                        <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                                                    ))}
                                                </Space>
                                            </Radio.Group> 
                                        )}
                                        {isDropdown && ( 
                                            <Select style={{ width: '100%' }} placeholder="Seçiniz">
                                                {displayOptions.map((opt:any) => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
                                            </Select> 
                                        )}
                                        {isText && ( 
                                            <Input.TextArea rows={2} style={{ resize: 'none' }} placeholder="Cevap giriniz..." /> 
                                        )}
                                    </Form.Item>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{padding: 20, textAlign: 'center', color: '#999'}}>Bu başvuruya ait form cevabı bulunamadı.</div>
                )}
                
                {(isEdit || isFeedback) && <div style={{ textAlign: 'right', marginTop: 20, marginBottom: 50 }}><Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{backgroundColor: PRIMARY_COLOR}}>Kaydet</Button></div>}
            </Form>

            <AppointmentModal visible={isAppointmentModalOpen} onCancel={() => setIsAppointmentModalOpen(false)} sessionId={sessionData.sessionId} studentName={sessionData.studentName} />
        </div>
    );
};

// ============================================================================
// 5. ÖĞRENCİ ARAMA VE DETAY MODÜLÜ (TARİH FORMATLAMA VE NULL CHECK EKLENDİ)
// ============================================================================
const StudentSearchModule = ({ onViewStudent }: { onViewStudent: (id: any) => void }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentProfileDetail[]>([]);

    const handleSearch = async (values: any) => {
        setLoading(true);
        try {
            const formatted = { 
                ...values, 
                sessionDateStart: values.sessionDateRange ? values.sessionDateRange[0].format('DD.MM.YYYY') : '', 
                sessionDateFinish: values.sessionDateRange ? values.sessionDateRange[1].format('DD.MM.YYYY') : '', 
                sessionDateRange: undefined 
            };
            const data = await agent.Students.searchAdvanced(formatted);
            setResults(data || []);
            if(data?.length > 0) message.success(`${data.length} öğrenci bulundu.`); else message.warning("Kriterlere uygun kayıt bulunamadı.");
        } catch { message.error("Arama hatası"); } finally { setLoading(false); }
    };

    const columns = [
        { title: 'Öğrenci No', dataIndex: 'studentNo', width: 120, render: (t: string) => <Tag color="blue" style={{fontWeight:'bold'}}>{t}</Tag> },
        { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
        { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
        { title: 'Fakülte', dataIndex: 'faculty', key: 'faculty', ellipsis: true },
        { title: 'Bölüm', dataIndex: 'department', key: 'department', ellipsis: true },
        { title: 'Düzey', dataIndex: 'academicLevel', key: 'academicLevel', width: 100 },
        { title: 'İşlem', width: 100, align: 'center' as const, render: (_: any, r: any) => (<Button type="primary" size="small" icon={<EyeOutlined/>} onClick={() => onViewStudent(r.id)}>Detay</Button>) }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s', fontFamily: BOUN_FONT }}>
            <div style={sectionHeaderStyle}><SearchOutlined /> Öğrenci Arama</div>
            <Card style={cardStyle} bodyStyle={{padding: 24}}>
                <Form form={form} onFinish={handleSearch} layout="vertical" size="middle">
                    <Row gutter={[20, 10]}>
                        <Col xs={24} md={6}><Form.Item name="studentNo" label="Öğrenci No"><Input prefix={<UserOutlined style={{color:'silver'}}/>} placeholder="Örn: 2020..." /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="firstName" label="Ad"><Input /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="lastName" label="Soyad"><Input /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="gender" label="Cinsiyet"><Select allowClear><Option value="1">Erkek</Option><Option value="2">Kadın</Option></Select></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="faculty" label="Fakülte"><Input prefix={<GlobalOutlined style={{color:'silver'}}/>} placeholder="Fakülte" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="department" label="Bölüm"><Input prefix={<BookOutlined style={{color:'silver'}}/>} placeholder="Bölüm" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="academicLevel" label="Akademik Düzey"><Select allowClear placeholder="Seçiniz"><Option value="LISANS">Lisans</Option><Option value="YUKSEK">Yüksek Lisans</Option><Option value="DOKTORA">Doktora</Option><Option value="HAZIRLIK">Hazırlık</Option></Select></Form.Item></Col>
                        <Col xs={24} md={10}><Form.Item name="sessionDateRange" label="Başvuru Tarih Aralığı"><RangePicker format="DD.MM.YYYY" style={{width:'100%'}} /></Form.Item></Col>
                        <Col xs={24} md={7}><Form.Item name="gpaStart" label="Min. Not Ort. (GPA)"><InputNumber style={{width:'100%'}} step="0.01" min={0} max={4} placeholder="0.00 - 4.00" /></Form.Item></Col>
                        <Col xs={24} md={7}><Form.Item name="semesterMin" label="Minimum Dönem"><InputNumber style={{width:'100%'}} min={1} placeholder="Örn: 1" /></Form.Item></Col>
                    </Row>
                    <Divider style={{margin:'10px 0'}}/>
                    <div style={{display:'flex', justifyContent:'flex-end', gap: 10}}><Button icon={<ClearOutlined />} onClick={() => {form.resetFields(); setResults([]);}}>Temizle</Button><Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading} style={{backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, minWidth: 120}}>Ara</Button></div>
                </Form>
            </Card>
            {results.length > 0 && <Card title={`Sonuçlar (${results.length})`} style={cardStyle} bodyStyle={{padding: 0}}><Table dataSource={results} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{x: 800}} /></Card>}
        </div>
    );
};

const StudentDetailModule = ({ studentId, onViewSession, onBack }: { studentId: string | number, onViewSession: (id:number, mode: 'view'|'edit'|'feedback') => void, onBack: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentProfileDetail | null>(null);
    useEffect(() => { if (studentId) loadStudent(studentId); }, [studentId]);

    const loadStudent = async (id: string | number) => { 
        try { setLoading(true); const data = await agent.Students.getById(Number(id)); setStudent(data); } 
        catch { message.error("Öğrenci bulunamadı."); } finally { setLoading(false); } 
    };

    const handleDownloadExcel = async (sessionId: number) => {
        if (!student) return;
        try { message.loading("Hazırlanıyor...", 1); const response = await agent.Export.toExcel({ studentNo: student.studentNo }); const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Ogrenci_${student.studentNo}.xlsx`); document.body.appendChild(link); link.click(); link.remove(); } catch { message.error("İndirme başarısız."); }
    };

    const sessionColumns = [
        { title: 'Başvuru No', dataIndex: 'id', width: 100, render: (id:number) => <b>#{id}</b> },
        { 
            title: 'Tarih', 
            dataIndex: 'sessionDate', 
            width: 120, 
            render: (t: string) => safeDateFormat(t) // "Invalid Date" fix
        },
        { 
            title: 'Danışman', 
            dataIndex: 'advisorName', // Backend'den gelen yeni alan
            width: 150, 
            render: (name: string) => name || <span style={{color:'#999'}}>Atanmamış</span> 
        },
        { title: 'Durum', dataIndex: 'isArchived', width: 100, render: (archived: boolean) => archived ? <Tag icon={<LockOutlined />} color="red">Arşivli</Tag> : <Tag color="green">Aktif</Tag> },
        { title: 'İşlemler', key: 'actions', align: 'right' as const, render: (_: any, r: StudentSession) => (<Space><Tooltip title="Görüntüle"><Button type="primary" size="small" icon={<FileTextOutlined />} onClick={() => onViewSession(r.id, 'view')} /></Tooltip>{!r.isArchived && <Tooltip title="Düzenle"><Button size="small" style={{ borderColor: '#1890ff', color: '#1890ff' }} icon={<EditOutlined />} onClick={() => onViewSession(r.id, 'edit')} /></Tooltip>}{r.hasFeedback ? <Tooltip title="Değerlendirme"><Button danger size="small" icon={<FileDoneOutlined />} onClick={() => onViewSession(r.id, 'feedback')} /></Tooltip> : <Button danger size="small" icon={<FileDoneOutlined />} disabled />}<Tooltip title="Excel İndir"><Button size="small" icon={<DownloadOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', color: 'white' }} onClick={() => handleDownloadExcel(r.id)} /></Tooltip></Space>) }
    ];

    if (loading) return <div style={{textAlign:'center', padding:50}}><Spin size="large" /></div>;
    if (!student) return <div>Hata</div>;

    return (
        <div style={{ animation: 'fadeIn 0.3s', fontFamily: BOUN_FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
                <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>{student.firstName} {student.lastName}</Title>
                <Tag color="blue">{student.studentNo}</Tag>
            </div>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={9}>
                    <Card title={<Space><UserOutlined/> Kimlik & İletişim</Space>} extra={<Button size="small" icon={<EditOutlined />}>Düzenle</Button>} style={cardStyle}>
                        <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width: 130}}>
                            <Descriptions.Item label="Öğrenci No">{student.studentNo}</Descriptions.Item>
                            <Descriptions.Item label="Ad Soyad">{student.firstName} {student.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Cinsiyet">{student.gender || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Doğum Yılı">{student.birthYear || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Telefon">{student.mobilePhone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="E-posta">{student.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Yaşama Biçimi">{student.lifestyle || '-'}</Descriptions.Item>
                        </Descriptions>
                        <Divider dashed style={{margin:'15px 0'}} orientation="left" plain>İletişim Kişisi</Divider>
                        <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width: 130}}>
                            <Descriptions.Item label="Yakınlık">{student.contactDegree || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Adı">{student.contactPerson || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Telefon">{student.contactPhone || '-'}</Descriptions.Item>
                        </Descriptions>
                        <Divider dashed style={{margin:'15px 0'}} orientation="left" plain>Aile</Divider>
                        <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width: 130}}>
                            <Descriptions.Item label="Anne">{student.isMotherAlive || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Baba">{student.isFatherAlive || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Birliktelik">{student.parentMarriage || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                <Col xs={24} lg={15}>
                    <Card title={<Space><BookOutlined/> Akademik Bilgiler</Space>} style={cardStyle}>
                        <Descriptions column={2} bordered size="small" labelStyle={{fontWeight:'bold'}}>
                            <Descriptions.Item label="Fakülte">{student.faculty}</Descriptions.Item>
                            <Descriptions.Item label="Bölüm">{student.department}</Descriptions.Item>
                            <Descriptions.Item label="Dönem">{student.semester || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Düzey">{student.academicLevel}</Descriptions.Item>
                            <Descriptions.Item label="Burs">{student.isScholar || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                    <Card title="Geçmiş Başvurular" extra={<Button type="primary" size="small" icon={<PlusOutlined />} style={{backgroundColor: PRIMARY_COLOR}}>Yeni Başvuru</Button>} style={cardStyle}>
                        {/* GÜVENLİ LİSTELEME (Beyaz sayfa önlemi) */}
                        <Table dataSource={student.sessions || []} columns={sessionColumns} rowKey="id" pagination={false} size="small" locale={{emptyText: 'Kayıt yok.'}} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// ============================================================================
// 6. İÇERİK VE SORU YÖNETİMİ
// ============================================================================
const QuestionManager = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [form] = Form.useForm();
    
    useEffect(() => { loadQ(); }, []);
    
    const loadQ = async () => { try { const res = await agent.Forms.listQuestions(); setQuestions(res); } catch { setQuestions([]); } };
    
    const GROUPS: Record<number, { label: string; color: string }> = { 
        1: { label: 'Kimlik Bilgileri', color: 'blue' }, 
        2: { label: 'Akademik Bilgiler', color: 'cyan' }, 
        3: { label: 'Psikolojik Durum', color: 'purple' }, 
        4: { label: 'Şikayet / Başvuru Nedeni', color: 'orange' }, 
        5: { label: 'Ailevi Bilgiler', color: 'green' } 
    };

    const handleSubmit = async (v: any) => { 
        const dto = { ...item, ...v, options: v.options ? v.options.split(',').map((o:string,i:number)=>({optionTitle:o.trim(),optionValue:o.trim(),sortOrder:i})) : [] }; 
        try { await agent.Forms.createQuestion(dto); setOpen(false); loadQ(); message.success('Kaydedildi'); } catch { message.error('Hata'); } 
    };
    
    return (
        <Card style={cardStyle} title={<Space><AppstoreOutlined style={{color:PRIMARY_COLOR}}/> Soru Listesi</Space>} extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setItem({id:0}); form.resetFields(); setOpen(true)}} style={{backgroundColor: PRIMARY_COLOR}}>Soru Ekle</Button>}>
            <Table dataSource={questions} rowKey="id" pagination={{pageSize:8}} size="middle" scroll={{x:700}} columns={[
                { title:'Kategori', dataIndex:'questionGroup', width: 180, render: (g: number) => GROUPS[g] ? <Tag color={GROUPS[g].color}>{GROUPS[g].label}</Tag> : <Tag>{g}</Tag> },
                { title:'Soru', dataIndex:'questionTitle', ellipsis: true },
                { title:'Tip', dataIndex:'questionType', width: 100, render: (t:number) => t===1?'Metin':(t===2?'Tekli':'Çoklu') },
                { title:'İşlem', width: 100, align:'center', render:(_,r)=><Space><Button size="small" icon={<EditOutlined/>} onClick={()=>{setItem({...r, options: r.options?.map((o:any)=>o.optionValue).join(',')}); form.setFieldsValue({...r, options: r.options?.map((o:any)=>o.optionValue).join(',')}); setOpen(true)}}/><Popconfirm title="Sil?" onConfirm={async()=>{await agent.Forms.deleteQuestion(r.id); loadQ();}}><Button size="small" danger icon={<DeleteOutlined/>}/></Popconfirm></Space>}
            ]}/>
            <Modal open={open} onCancel={()=>setOpen(false)} footer={null} destroyOnClose title={item?.id ? 'Soruyu Düzenle' : 'Soru Ekle'} centered width={700} styles={{header: {fontFamily: BOUN_FONT, color: PRIMARY_COLOR}}}>
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={item} style={{fontFamily: BOUN_FONT}}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="questionGroup" label="Kategori" rules={[{required:true}]}><Select placeholder="Seçiniz" size="large">{Object.entries(GROUPS).map(([key, val]) => (<Option key={key} value={Number(key)}>{val.label}</Option>))}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="displayOrderNo" label="Sıralama No"><InputNumber style={{width:'100%'}} size="large" min={0} placeholder="0" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="questionTitle" label="Soru Başlığı" rules={[{required:true}]}><Input.TextArea rows={2} placeholder="Soruyu giriniz..." /></Form.Item>
                    <Row gutter={16}>
                         <Col span={12}><Form.Item name="questionType" label="Soru Tipi" rules={[{required:true}]}><Select placeholder="Seçiniz" size="large"><Option value={1}>Metin (Açık Uçlu)</Option><Option value={2}>Tek Seçim (Radio)</Option><Option value={3}>Çoklu Seçim (Checkbox)</Option></Select></Form.Item></Col>
                         <Col span={12}><Form.Item name="isActive" label="Durum" initialValue={true}><Select placeholder="Seçiniz" size="large"><Option value={true}>Aktif</Option><Option value={false}>Pasif</Option></Select></Form.Item></Col>
                    </Row>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.questionType !== curr.questionType}>{({ getFieldValue }) => getFieldValue('questionType') !== 1 && (<Form.Item name="options" label="Seçenekler (Virgülle ayırın)" help="Örnek: Evet, Hayır, Belki" rules={[{required:true, message:'Seçenek giriniz.'}]}><Input.TextArea rows={3} placeholder="Örn: Seçenek A, Seçenek B" /></Form.Item>)}</Form.Item>
                    <div style={{textAlign:'right', marginTop:20, borderTop:'1px solid #eee', paddingTop:15}}><Space><Button onClick={()=>setOpen(false)}>İptal</Button><Button type="primary" htmlType="submit" size="large" style={{backgroundColor: PRIMARY_COLOR}}>Kaydet</Button></Space></div>
                </Form>
            </Modal>
        </Card>
    );
};

const ContentEditor = ({ prefixFilter, title }: { prefixFilter: string, title: string }) => {
    const [contents, setContents] = useState<SiteContent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SiteContent | null>(null);
    const [form] = Form.useForm();
    useEffect(() => { loadContent(); }, []);
    const loadContent = async () => { try { const res = await agent.Content.getAll(); setContents(res.filter(c => c.key.startsWith(prefixFilter))); } catch { setContents([]); } };
    const handleSave = async (v: any) => { if(!editingItem) return; await agent.Content.update({key:editingItem.key, value:v.value}); setIsModalOpen(false); loadContent(); message.success('Güncellendi'); };
    const stripHtml = (h: string) => { const t = document.createElement("DIV"); t.innerHTML = h; return t.textContent || t.innerText || ""; };
    
    return (
        <Card style={cardStyle} title={<Space><FileTextOutlined style={{color:PRIMARY_COLOR}}/> {title}</Space>}>
            <Table dataSource={contents} columns={[{title:'Alan', dataIndex:'key', width:200, render:(t:string)=><Tag color="geekblue">{t.replace(prefixFilter,'')}</Tag>}, {title:'İçerik', dataIndex:'value', ellipsis:true, render:(v:string)=>stripHtml(v)}, {title:'İşlem', width:100, align:'center', render:(_,r)=><Button type="dashed" size="small" icon={<EditOutlined/>} onClick={()=>{setEditingItem(r); form.setFieldsValue({value:r.value}); setIsModalOpen(true)}}>Düzenle</Button>}]} rowKey="key" pagination={false} scroll={{x:600}} />
            <Modal open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={form.submit} width={800} destroyOnClose title={`Düzenle: ${editingItem?.key.replace(prefixFilter,'')}`} centered><Form form={form} onFinish={handleSave}><Form.Item name="value"><ReactQuill theme="snow" modules={quillModules} style={{height:300, marginBottom:50}} /></Form.Item></Form></Modal>
        </Card>
    );
};

// --- GENERIC USER MANAGER ---
const GenericUserManager = ({ title, data, columns, onAdd, onEdit, onDelete, formFields }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    const handleAddClick = () => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); };
    const handleEditClick = (record: any) => { setEditingItem(record); form.setFieldsValue(record); setIsModalOpen(true); };
    const handleSave = (values: any) => { onAdd(values, editingItem); setIsModalOpen(false); };
    const enhancedColumns = [...columns, { title: 'İşlem', key: 'action', width: 100, align:'center', render: (_:any, r: any) => (<Space><Button size="small" icon={<EditOutlined />} onClick={() => handleEditClick(r)} /><Popconfirm title="Sil?" onConfirm={() => onDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space>) }];
    
    return (
        <Card style={cardStyle} title={<Space><TeamOutlined style={{color:PRIMARY_COLOR}}/> {title}</Space>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} style={{backgroundColor: PRIMARY_COLOR}}>Ekle</Button>}>
            <Table dataSource={data} columns={enhancedColumns} rowKey="id" scroll={{x: 600}} size="middle" />
            <Modal title={editingItem ? "Düzenle" : "Ekle"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={form.submit} destroyOnClose centered><Form form={form} layout="vertical" onFinish={handleSave} initialValues={{isActive: true}}>{formFields}</Form></Modal>
        </Card>
    );
};

// ============================================================================
// 7. ANA ADMIN PANEL (ROUTING VE BİRLEŞTİRME)
// ============================================================================
const AdminPanel = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('0'); 
    const [selectedStudentId, setSelectedStudentId] = useState<string | number | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [sessionViewMode, setSessionViewMode] = useState<'view'|'edit'|'feedback'>('view');
    
    // Local state for generic managers (Backend API yoksa UI test için)
    const [users, setUsers] = useState([{id:'1', userName:'admin', email:'admin@boun.edu.tr', role:'Admin', isActive: true}]);
    const [therapists, setTherapists] = useState([{id:1, firstName:'Ayşe', lastName:'Yılmaz', email:'ayse@boun.edu.tr', title:'Psk.', isActive:true}]);
    const [secretaries, setSecretaries] = useState([{ id: 1, firstName: 'Zeynep', lastName: 'Demir', email: 'zeynep.demir@boun.edu.tr', campus: 'Kuzey Kampüs', isActive: true }]);

    useEffect(() => { 
        if (location.state && location.state.targetTab) { 
            setActiveTab(location.state.targetTab); 
            if(location.state.targetTab === 'search') { setSelectedStudentId(null); setSelectedSessionId(null); } 
        } 
    }, [location]);

    const handleMenuClick = (key: string) => { 
        if(key === 'search') { 
            if(activeTab === 'session-detail') handleBackToStudent(); 
            else if(activeTab === 'student-detail') handleBackToSearch(); 
            else setActiveTab('search'); 
        } else { setActiveTab(key); } 
        setMobileDrawerVisible(false); 
    };
    
    const handleViewStudent = (id: string | number) => { setSelectedStudentId(id); setActiveTab('student-detail'); };
    const handleBackToSearch = () => { setSelectedStudentId(null); setActiveTab('search'); };
    const handleViewSession = (id: number, mode: 'view'|'edit'|'feedback') => { setSelectedSessionId(id); setSessionViewMode(mode); setActiveTab('session-detail'); };
    const handleBackToStudent = () => { setSelectedSessionId(null); setActiveTab('student-detail'); };

    const menuItems = [
        { key: '0', icon: <DashboardOutlined />, label: 'Panel Özeti' },
        { key: 'search', icon: <SearchOutlined />, label: 'Öğrenci İşlemleri' },
        { type: 'divider' },
        { key: 'therapist-view', icon: <MedicineBoxOutlined />, label: 'Terapist Paneli (Demo)' },
        { key: 'secretary-view', icon: <CalendarOutlined />, label: 'Sekreter Paneli (Demo)' },
        { type: 'divider' },
        { key: '1', icon: <FormOutlined />, label: 'İçerik Ayarları' },
        { key: '2', icon: <UserOutlined />, label: 'Kullanıcılar' },
        { key: '3', icon: <TeamOutlined />, label: 'Terapistler' },
        { key: '4', icon: <SolutionOutlined />, label: 'Sekreterler' }
    ];

    const MenuContent = () => (
        <Menu theme="dark" selectedKeys={[ ['student-detail', 'session-detail'].includes(activeTab) ? 'search' : activeTab ]} mode="inline" items={menuItems} onClick={(e) => handleMenuClick(e.key)} style={{border: 'none', background: 'transparent', fontFamily: BOUN_FONT}} />
    );

    return (
        <Layout style={{ height: '100%', minHeight: 'calc(100vh - 80px)', background: '#f5f7fa', fontFamily: BOUN_FONT }}>
            <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" collapsedWidth="80" onBreakpoint={(broken) => { if(broken) setCollapsed(true); }} width={250} theme="dark" style={{ background: '#001529', boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
                <div style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color:'white', fontWeight:'bold', fontSize: 16, fontFamily: BOUN_FONT }}>{collapsed ? 'YP' : 'YÖNETİM PANELİ'}</div>
                <MenuContent />
            </Sider>

            <Drawer title="Menü" placement="left" onClose={() => setMobileDrawerVisible(false)} open={mobileDrawerVisible} bodyStyle={{ padding: 0, backgroundColor: '#001529' }} headerStyle={{ display:'none' }} width={240}>
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color:'white', fontWeight:'bold', fontSize: 18, background: '#002140', fontFamily: BOUN_FONT }}>BÜREM MOBİL</div>
                <MenuContent />
            </Drawer>

            <Layout style={{ transition: 'all 0.2s', background: 'transparent' }}>
                <Header style={{ padding: '0 24px', background: '#fff', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid #f0f0f0', height: 64, boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => { if (window.innerWidth < 992) setMobileDrawerVisible(true); else setCollapsed(!collapsed); }} style={{ fontSize: '16px', width: 64, height: 64 }} />
                        <span style={{ fontSize: 18, fontWeight: 600, color: PRIMARY_COLOR, marginLeft: 10, fontFamily: BOUN_FONT }}>
                            {activeTab === '0' && 'Genel Bakış'}
                            {activeTab === 'search' && 'Öğrenci Yönetimi'}
                            {['1','2','3','4'].includes(activeTab) && 'Sistem Ayarları'}
                            {activeTab === 'therapist-view' && 'Terapist Paneli'}
                            {activeTab === 'secretary-view' && 'Sekreter Paneli'}
                        </span>
                    </div>
                </Header>
                
                <Content style={{ margin: '24px', overflowY: 'auto', minHeight: 280 }}>
                    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
                        {activeTab === '0' && <Dashboard />}
                        
                        {/* ÖZEL PANELLER */}
                        {activeTab === 'therapist-view' && <TherapistDashboard />}
                        {activeTab === 'secretary-view' && <SecretaryDashboard />}

                        {/* ÖĞRENCİ YÖNETİMİ */}
                        {activeTab === 'search' && <StudentSearchModule onViewStudent={handleViewStudent} />}
                        {activeTab === 'student-detail' && selectedStudentId && <StudentDetailModule studentId={selectedStudentId} onViewSession={handleViewSession} onBack={handleBackToSearch} />}
                        {activeTab === 'session-detail' && selectedSessionId && <SessionDetailModule sessionId={selectedSessionId} mode={sessionViewMode} onBack={handleBackToStudent} />}
                        
                        {/* İÇERİK VE FORM */}
                        {activeTab === '1' && (
                            <div style={{animation:'fadeIn 0.3s'}}>
                                <div style={sectionHeaderStyle}><FileTextOutlined /> İçerik ve Form Ayarları</div>
                                <Tabs type="card" items={[
                                    { key: '1', label: 'Duyuru Popup', children: <ContentEditor prefixFilter="Announcement_" title="Giriş Popup Metni" /> }, 
                                    { key: '2', label: 'Onam Formu', children: <ContentEditor prefixFilter="Consent_" title="Aydınlatılmış Onam Metni" /> }, 
                                    { key: '3', label: 'Soru Havuzu', children: <QuestionManager /> }
                                ]} />
                            </div>
                        )}

                        {/* KULLANICI YÖNETİMİ (Generic) */}
                        {activeTab === '2' && (
                            <GenericUserManager 
                                title="Kullanıcı Listesi" 
                                data={users} 
                                columns={[
                                    { title: 'Kullanıcı Adı', dataIndex: 'userName' }, 
                                    { title: 'Email', dataIndex: 'email' }, 
                                    { title: 'Rol', dataIndex: 'role', render: (r:string) => <Tag>{r}</Tag> },
                                    { title: 'Durum', dataIndex: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={(v:any, old:any) => setUsers(old ? users.map(u=>u.id===old.id?{...u,...v}:u) : [...users,{id:Date.now().toString(),...v}])} 
                                onDelete={(id:any)=>setUsers(users.filter(u=>u.id!==id))} 
                                formFields={
                                    <>
                                        <Form.Item name="userName" label="Kullanıcı Adı" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="email" label="Email" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="role" label="Rol" rules={[{required:true}]}><Select><Option value="Admin">Admin</Option><Option value="Secretary">Sekreter</Option><Option value="Therapist">Terapist</Option></Select></Form.Item>
                                        <Form.Item name="isActive" label="Durum" valuePropName="checked" initialValue={true}><Switch checkedChildren="Aktif" unCheckedChildren="Pasif" /></Form.Item>
                                    </>
                                } 
                            />
                        )}
                        {activeTab === '3' && (
                            <GenericUserManager 
                                title="Terapist Listesi" 
                                data={therapists} 
                                columns={[
                                    { title: 'Unvan', dataIndex: 'title', width:80 }, 
                                    { title: 'Ad Soyad', render: (r:any)=>`${r.firstName} ${r.lastName}` }, 
                                    { title: 'Email', dataIndex: 'email' }, 
                                    { title: 'Durum', dataIndex: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={(v:any, old:any) => setTherapists(old ? therapists.map(t=>t.id===old.id?{...t,...v}:t) : [...therapists,{id:Date.now(),...v}])} 
                                onDelete={(id:any)=>setTherapists(therapists.filter(t=>t.id!==id))} 
                                formFields={
                                    <>
                                        <Row gutter={16}>
                                            <Col span={8}><Form.Item name="title" label="Unvan"><Input/></Form.Item></Col>
                                            <Col span={8}><Form.Item name="firstName" label="Ad"><Input/></Form.Item></Col>
                                            <Col span={8}><Form.Item name="lastName" label="Soyad"><Input/></Form.Item></Col>
                                        </Row>
                                        <Form.Item name="email" label="Email"><Input/></Form.Item>
                                        <Form.Item name="isActive" label="Durum" valuePropName="checked"><Switch checkedChildren="Aktif" unCheckedChildren="Pasif"/></Form.Item>
                                    </>
                                } 
                            />
                        )}
                        {activeTab === '4' && (
                            <GenericUserManager 
                                title="Sekreter Listesi" 
                                data={secretaries} 
                                columns={[
                                    { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
                                    { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
                                    { title: 'Email', dataIndex: 'email', key: 'email' },
                                    { title: 'Kampüs', dataIndex: 'campus', key: 'campus', render: (t:string) => <Tag color="blue">{t}</Tag> },
                                    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={(v:any, old:any) => setSecretaries(old ? secretaries.map(s=>s.id===old.id?{...s,...v}:s) : [...secretaries,{id:Date.now(),...v}])} 
                                onDelete={(id:any)=>setSecretaries(secretaries.filter(s=>s.id!==id))} 
                                formFields={
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}><Form.Item name="firstName" label="Ad" rules={[{required:true}]}><Input /></Form.Item></Col>
                                            <Col span={12}><Form.Item name="lastName" label="Soyad" rules={[{required:true}]}><Input /></Form.Item></Col>
                                        </Row>
                                        <Form.Item name="email" label="Email" rules={[{required:true, type:'email'}]}><Input prefix={<UserOutlined />} /></Form.Item>
                                        <Form.Item name="campus" label="Görev Yeri (Kampüs)" rules={[{required:true}]}>
                                            <Select>
                                                <Option value="Kuzey Kampüs">Kuzey Kampüs</Option>
                                                <Option value="Güney Kampüs">Güney Kampüs</Option>
                                                <Option value="Kandilli Kampüsü">Kandilli Kampüsü</Option>
                                                <Option value="Sarıtepe Kampüsü">Sarıtepe Kampüsü</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name="isActive" label="Durum" valuePropName="checked" initialValue={true}>
                                            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                                        </Form.Item>
                                    </>
                                } 
                            />
                        )}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminPanel;