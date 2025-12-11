import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Layout, Menu, Table, Button, Modal, Form, Input, Tabs, message, 
    Card, Select, Popconfirm, Tag, Space, Row, Col, Statistic, 
    DatePicker, Tooltip, InputNumber, Descriptions, Spin, Switch, Drawer, Collapse, Alert, Typography, 
    Divider, List, Avatar, Timeline, Checkbox, Progress
} from 'antd';
import { 
    FormOutlined, PlusOutlined, DeleteOutlined, 
    EditOutlined, UserOutlined, TeamOutlined, SearchOutlined, 
    DashboardOutlined, SolutionOutlined, 
    EyeOutlined, ClearOutlined, ArrowLeftOutlined,
    FileTextOutlined, FileDoneOutlined, DownloadOutlined, 
    SaveOutlined, MenuUnfoldOutlined, MenuFoldOutlined,
    BookOutlined, CalendarOutlined, CheckCircleOutlined,
    AppstoreOutlined, GlobalOutlined, 
    MedicineBoxOutlined, AlertOutlined, FileProtectOutlined,
    RiseOutlined, PieChartOutlined, FallOutlined,
    LockOutlined, BuildOutlined, IdcardOutlined, UnlockOutlined, ScheduleOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import dayjs from 'dayjs'; 
import 'dayjs/locale/tr';

// --- API AGENT ---
import agent from '../../api/agent';
import type { 
    StudentProfileDetail, 
    Question, 
    SiteContent, 
    StudentSession 
} from '../../api/agent';

// --- HARİCİ MODÜLLER (Önceki adımda oluşturduklarımız) ---
import TherapistModule from './TherapistModule';
import SecretaryModule from './SecretaryModule';

// --- MODAL ---
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

const safeDateFormat = (dateString: string | undefined | null, format = 'DD.MM.YYYY') => {
    if (!dateString) return '-';
    const d = dayjs(dateString);
    return d.isValid() ? d.format(format) : dateString;
};

// ============================================================================
// 1. DASHBOARD MODULE (Canlı Veri Güncellendi)
// ============================================================================
const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterFaculty, setFilterFaculty] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                // API ÇAĞRISI
                const data = await agent.Stats.getDashboard();
                setStats(data);
            } catch (error) {
                console.error("Dashboard verisi çekilemedi", error);
                // Hata olsa bile UI bozulmasın diye boş obje
                setStats({ totalStudents: 0, totalSessions: 0, todaySessions: 0, pendingForms: 0, activeCases: 0, riskCases: 0, completedProcess: 0 });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{padding:50, textAlign:'center'}}>
            <Spin size="large" tip="Yükleniyor...">
                <div style={{ height: 50, width: '100%' }} />
            </Spin>
        </div>
    );
    
    // Sabit grafik verileri (İleride API'den gelebilir)
    const facultyData = [
        { name: 'Eğitim Fakültesi', value: 35, color: '#1890ff' },
        { name: 'Fen-Edebiyat Fak.', value: 25, color: '#52c41a' },
        { name: 'Mühendislik Fak.', value: 20, color: '#faad14' },
        { name: 'İİBF', value: 15, color: '#f5222d' },
        { name: 'Diğer', value: 5, color: '#722ed1' },
    ];

    const therapistPerformance = [
        { key: 1, name: 'Rabia Özdemir', active: 12, completed: 45, satisfaction: 4.8, status: 'Müsait' },
        { key: 2, name: 'Mehmet Turan', active: 15, completed: 30, satisfaction: 4.5, status: 'Dolu' },
    ];

    const sessionDropOff = [
        { session: '1. Seans', count: 100, percent: 100 },
        { session: '2. Seans', count: 85, percent: 85 },
        { session: '3. Seans', count: 70, percent: 70 },
        { session: '4. Seans', count: 60, percent: 60 },
        { session: '5. Seans', count: 50, percent: 50 },
    ];

    const performanceColumns = [
        { title: 'Uzman Adı', dataIndex: 'name', key: 'name', render: (text: string) => <><Avatar style={{ backgroundColor: '#1e4a8b', marginRight: 8 }} icon={<UserOutlined />} />{text}</> },
        { title: 'Aktif Danışan', dataIndex: 'active', key: 'active', sorter: (a:any, b:any) => a.active - b.active },
        { title: 'Tamamlanan Süreç', dataIndex: 'completed', key: 'completed' },
        { title: 'Memnuniyet (5)', dataIndex: 'satisfaction', key: 'satisfaction', render: (score: number) => (<Tooltip title={`${score} / 5`}><Progress percent={score * 20} steps={5} strokeColor={score > 4.5 ? '#52c41a' : '#1890ff'} showInfo={false} /><span style={{ marginLeft: 8 }}>{score}</span></Tooltip>) },
        { title: 'Durum', dataIndex: 'status', key: 'status', render: (status: string) => (<Tag color={status === 'Müsait' ? 'green' : (status === 'Dolu' ? 'red' : 'default')}>{status}</Tag>) }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s', fontFamily: BOUN_FONT }}>
            <Card variant="borderless" style={{ ...cardStyle, marginBottom: 24 }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} md={12}>
                        <Title level={3} style={{ margin: 0, color: '#003366' }}>
                            <RiseOutlined /> Yönetim ve Raporlama Paneli
                        </Title>
                        <Text type="secondary">BÜREM istatistikleri ve süreç analizleri</Text>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Space>
                            <RangePicker placeholder={['Başlangıç', 'Bitiş']} />
                            <Select placeholder="Fakülte Filtrele" style={{ width: 150 }} allowClear onChange={setFilterFaculty}>
                                <Option value="egitim">Eğitim Fak.</Option>
                                <Option value="muhendislik">Mühendislik Fak.</Option>
                            </Select>
                            <Button type="primary" icon={<FileTextOutlined />}>Excel Raporu İndir</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Card><Statistic title="Toplam Başvuru" value={stats?.totalStudents || 0} prefix={<FileTextOutlined />} valueStyle={{ color: '#3f8600' }} /><Progress percent={70} showInfo={false} strokeColor="#3f8600" size="small" /><div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>Geçen aya göre %12 artış</div></Card></Col>
                <Col span={6}><Card><Statistic title="Aktif Görüşmeler" value={stats?.activeCases || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /><Progress percent={45} showInfo={false} strokeColor="#1890ff" size="small" /><div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>Kapasite doluluk oranı: %85</div></Card></Col>
                <Col span={6}><Card><Statistic title="Tamamlanan Süreç" value={stats?.completedProcess || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#722ed1' }} /><Progress percent={100} showInfo={false} strokeColor="#722ed1" size="small" /><div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>Başarılı sonlandırma</div></Card></Col>
                <Col span={6}><Card style={{ background: '#fff1f0', borderColor: '#ffa39e' }}><Statistic title="Yüksek Riskli Vaka" value={stats?.riskCases || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#cf1322' }} /><div style={{ color: '#cf1322', marginTop: 10, fontWeight: 'bold' }}>Acil Müdahale Gerekebilir</div></Card></Col>
            </Row>

            <Card variant="borderless" style={cardStyle} styles={{ body: { padding: 24 } }}>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: <span><PieChartOutlined /> Başvuru Dağılımları</span>,
                        children: (
                            <Row gutter={24}>
                                <Col xs={24} md={12}>
                                    <Title level={5}>Fakülte Bazlı Dağılım</Title>
                                    <div style={{ marginTop: 20 }}>
                                        {facultyData.map((item, index) => (
                                            <div key={index} style={{ marginBottom: 15 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>{item.name}</Text><Text type="secondary">{item.value}%</Text></div>
                                                <Progress percent={item.value} strokeColor={item.color} />
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Title level={5}>Başvuru Nedenleri</Title>
                                    <List itemLayout="horizontal" dataSource={[{ title: 'Akademik Kaygı', percent: 40, color: 'red' }, { title: 'Depresif Belirtiler', percent: 25, color: 'orange' }, { title: 'İlişkisel Sorunlar', percent: 20, color: 'blue' }]} renderItem={(item) => (<List.Item><List.Item.Meta avatar={<Avatar style={{ backgroundColor: item.color }} size="small" />} title={item.title} description={<Progress percent={item.percent} status="active" strokeColor={item.color} />} /></List.Item>)} />
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: '2',
                        label: <span><TeamOutlined /> Terapist Performansı</span>,
                        children: <Table dataSource={therapistPerformance} columns={performanceColumns} pagination={false} />
                    },
                    {
                        key: '3',
                        label: <span><FallOutlined /> Seans Devamlılığı</span>,
                        children: (
                            <div style={{ padding: 20 }}>
                                <Title level={5}>Görüşme 1-5 Arası Devamlılık Analizi</Title>
                                <Row gutter={[16, 16]}>
                                    {sessionDropOff.map((item, index) => (
                                        <Col span={4} key={index} style={{ textAlign: 'center' }}>
                                            <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}>
                                                <div style={{ width: 40, height: `${item.percent}%`, background: item.percent > 50 ? '#1890ff' : '#ffec3d', borderRadius: '4px 4px 0 0' }} />
                                            </div>
                                            <div style={{ fontWeight: 'bold' }}>{item.session}</div>
                                            <div style={{ fontSize: 12, color: '#888' }}>{item.count} Kişi</div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )
                    }
                ]} />
            </Card>
        </div>
    );
};

// ============================================================================
// 2. DEFINITION MANAGER (TANIMLAMA YÖNETİMİ)
// ============================================================================
const DefinitionManager = ({ defaultTab = '1' }: { defaultTab?: string }) => {
    const [campuses, setCampuses] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [newCampus, setNewCampus] = useState("");
    const [newType, setNewType] = useState("");
    const [newRole, setNewRole] = useState("");
    const [holidayDate, setHolidayDate] = useState("");
    const [holidayDesc, setHolidayDesc] = useState("");

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cData, tData, rData, hData] = await Promise.all([
                agent.Definitions.listCampuses(),
                agent.Definitions.listTherapistTypes(),
                agent.Definitions.listRoles(),
                agent.Definitions.listHolidays()
            ]);
            setCampuses(cData || []);
            setTypes(tData || []);
            setRoles(rData || []);
            setHolidays(hData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (type: 'campus'|'type'|'role'|'holiday') => {
        try {
            if (type === 'campus') {
                if(!newCampus) return message.warning("İsim giriniz");
                await agent.Definitions.createCampus({ name: newCampus });
                setNewCampus("");
            } else if (type === 'type') {
                if(!newType) return message.warning("İsim giriniz");
                await agent.Definitions.createTherapistType({ name: newType });
                setNewType("");
            } else if (type === 'role') {
                if(!newRole) return message.warning("İsim giriniz");
                await agent.Definitions.createRole({ roleName: newRole });
                setNewRole("");
            } else if (type === 'holiday') {
                if(!holidayDate) return message.warning("Tarih seçiniz");
                await agent.Definitions.createHoliday({ date: holidayDate, description: holidayDesc, currentUserRoleId: 1 });
                setHolidayDate(""); setHolidayDesc("");
            }
            message.success("Eklendi");
            loadData();
        } catch(e) { message.error("İşlem başarısız"); }
    };

    const handleDelete = async (type: 'campus'|'type'|'role'|'holiday', id: number) => {
        try {
            if (type === 'campus') await agent.Definitions.deleteCampus(id);
            else if (type === 'type') await agent.Definitions.deleteTherapistType(id);
            else if (type === 'role') await agent.Definitions.deleteRole(id);
            else if (type === 'holiday') await agent.Definitions.deleteHoliday(id);
            
            message.success("Silindi");
            loadData();
        } catch(e) { message.error("Silinemedi (Kullanımda olabilir)"); }
    };

    const commonColumns = (type: 'campus'|'type'|'role'|'holiday') => [
        { title: 'ID', dataIndex: 'id', width: 60 },
        { 
            title: type === 'holiday' ? 'Tarih' : 'Tanım Adı', 
            dataIndex: type === 'role' ? 'roleName' : (type === 'holiday' ? 'holidayDate' : 'name'),
            render: (val: any) => type === 'holiday' ? dayjs(val).format('DD.MM.YYYY') : <b>{val}</b>
        },
        ...(type === 'holiday' ? [{ title: 'Açıklama', dataIndex: 'description' }] : []),
        { 
            title: 'İşlem', width: 80, align: 'center' as const, 
            render: (_: any, r: any) => (
                <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleDelete(type, r.id)}>
                    <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    return (
        <Card style={cardStyle} title={<Space><AppstoreOutlined style={{color:PRIMARY_COLOR}}/> Sistem Tanımlamaları</Space>}>
            <Tabs defaultActiveKey={defaultTab} type="card" items={[
                {
                    key: '1', label: <span><BuildOutlined /> Kampüsler</span>,
                    children: (
                        <div>
                            <div style={{display:'flex', gap:10, marginBottom:15}}>
                                <Input placeholder="Yeni Kampüs Adı" value={newCampus} onChange={e=>setNewCampus(e.target.value)} />
                                <Button type="primary" icon={<PlusOutlined/>} onClick={()=>handleAdd('campus')}>Ekle</Button>
                            </div>
                            <Table dataSource={campuses} columns={commonColumns('campus')} rowKey="id" pagination={{pageSize:5}} size="small" loading={loading} />
                        </div>
                    )
                },
                {
                    key: '2', label: <span><IdcardOutlined /> Uzman Tipleri</span>,
                    children: (
                        <div>
                            <div style={{display:'flex', gap:10, marginBottom:15}}>
                                <Input placeholder="Örn: Deneyimli Uzman" value={newType} onChange={e=>setNewType(e.target.value)} />
                                <Button type="primary" icon={<PlusOutlined/>} onClick={()=>handleAdd('type')}>Ekle</Button>
                            </div>
                            <Table dataSource={types} columns={commonColumns('type')} rowKey="id" pagination={{pageSize:5}} size="small" loading={loading} />
                        </div>
                    )
                },
                {
                    key: '3', label: <span><UnlockOutlined /> Roller</span>,
                    children: (
                        <div>
                            <div style={{display:'flex', gap:10, marginBottom:15}}>
                                <Input placeholder="Rol Adı" value={newRole} onChange={e=>setNewRole(e.target.value)} />
                                <Button type="primary" icon={<PlusOutlined/>} onClick={()=>handleAdd('role')}>Ekle</Button>
                            </div>
                            <Table dataSource={roles} columns={commonColumns('role')} rowKey="id" pagination={{pageSize:5}} size="small" loading={loading} />
                        </div>
                    )
                },
                {
                    key: '4', label: <span><ScheduleOutlined /> Resmi Tatiller</span>,
                    children: (
                        <div>
                            <div style={{display:'flex', gap:10, marginBottom:15}}>
                                <Input type="date" style={{width: 200}} value={holidayDate} onChange={e=>setHolidayDate(e.target.value)} />
                                <Input placeholder="Tatil Açıklaması (Örn: Kar Tatili)" value={holidayDesc} onChange={e=>setHolidayDesc(e.target.value)} />
                                <Button type="primary" icon={<PlusOutlined/>} onClick={()=>handleAdd('holiday')}>Kaydet</Button>
                            </div>
                            <Table dataSource={holidays} columns={commonColumns('holiday')} rowKey="id" pagination={{pageSize:5}} size="small" loading={loading} />
                        </div>
                    )
                }
            ]} />
        </Card>
    );
};

// ============================================================================
// 3. SESSION DETAIL MODULE
// ============================================================================
const SessionDetailModule = ({ sessionId, mode = 'view', onBack }: { sessionId: number, mode?: 'view' | 'edit' | 'feedback', onBack: () => void }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null); 
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [localMode, setLocalMode] = useState(mode);

    useEffect(() => { 
        if (sessionId) loadData(sessionId); 
    }, [sessionId]);

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

    if (loading) return <div style={{textAlign:'center', padding:50}}><Spin size="large" tip="Yükleniyor..."><div style={{height:50}}/></Spin></div>;
    if (!sessionData) return <Alert message="Kayıt Bulunamadı" type="error" showIcon />;

    const isEdit = localMode === 'edit';
    const isFeedback = localMode === 'feedback';

    return (
        <div style={{ animation: 'fadeIn 0.3s', fontFamily: BOUN_FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ fontSize: 16, fontWeight: 600 }}>Geri Dön</Button>
                <Tag color={isEdit ? "processing" : "success"} style={{fontSize: 14, padding: '5px 10px'}}>{isEdit ? "Düzenleme Modu" : (isFeedback ? "Değerlendirme Modu" : "Görüntüleme Modu")}</Tag>
            </div>

            <Card style={cardStyle} title={<Space><UserOutlined style={{color: PRIMARY_COLOR}}/> <span style={{color: PRIMARY_COLOR}}>Başvuru Künyesi</span></Space>} styles={{ body: { padding: 24 } }}>
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
                        const hasOptions = q.options && q.options.length > 0;
                        const currentAnswer = form.getFieldValue(`q_${q.questionId}`);
                        const isNumericAnswer = ["0","1","2","3"].includes(String(currentAnswer));
                        
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
// 4. STUDENT SEARCH MODULE
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
            <Card style={cardStyle} styles={{ body: { padding: 24 } }}>
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
            {results.length > 0 && <Card title={`Sonuçlar (${results.length})`} style={cardStyle} styles={{ body: { padding: 0 } }}><Table dataSource={results} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{x: 800}} /></Card>}
        </div>
    );
};

// ============================================================================
// 5. STUDENT DETAIL MODULE
// ============================================================================
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
            render: (t: string) => safeDateFormat(t) 
        },
        { 
            title: 'Danışman', 
            dataIndex: 'advisorName', 
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
                    <Card title={<Space><UserOutlined/> Kimlik & İletişim</Space>} extra={<Button size="small" icon={<EditOutlined />}>Düzenle</Button>} style={cardStyle} styles={{ body: { padding: 24 } }}>
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
                    <Card title={<Space><BookOutlined/> Akademik Bilgiler</Space>} style={cardStyle} styles={{ body: { padding: 24 } }}>
                        <Descriptions column={2} bordered size="small" labelStyle={{fontWeight:'bold'}}>
                            <Descriptions.Item label="Fakülte">{student.faculty}</Descriptions.Item>
                            <Descriptions.Item label="Bölüm">{student.department}</Descriptions.Item>
                            <Descriptions.Item label="Dönem">{student.semester || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Düzey">{student.academicLevel}</Descriptions.Item>
                            <Descriptions.Item label="Burs">{student.isScholar || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                    <Card title="Geçmiş Başvurular" extra={<Button type="primary" size="small" icon={<PlusOutlined />} style={{backgroundColor: PRIMARY_COLOR}}>Yeni Başvuru</Button>} style={cardStyle} styles={{ body: { padding: 24 } }}>
                        <Table dataSource={student.sessions || []} columns={sessionColumns} rowKey="id" pagination={false} size="small" locale={{emptyText: 'Kayıt yok.'}} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// ============================================================================
// 6. QUESTION MANAGER
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
        <Card style={cardStyle} title={<Space><AppstoreOutlined style={{color:PRIMARY_COLOR}}/> Soru Listesi</Space>} extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setItem({id:0}); form.resetFields(); setOpen(true)}} style={{backgroundColor: PRIMARY_COLOR}}>Soru Ekle</Button>} styles={{ body: { padding: 24 } }}>
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
        <Card style={cardStyle} title={<Space><FileTextOutlined style={{color:PRIMARY_COLOR}}/> {title}</Space>} styles={{ body: { padding: 24 } }}>
            <Table dataSource={contents} columns={[{title:'Alan', dataIndex:'key', width:200, render:(t:string)=><Tag color="geekblue">{t.replace(prefixFilter,'')}</Tag>}, {title:'İçerik', dataIndex:'value', ellipsis:true, render:(v:string)=>stripHtml(v)}, {title:'İşlem', width:100, align:'center', render:(_,r)=><Button type="dashed" size="small" icon={<EditOutlined/>} onClick={()=>{setEditingItem(r); form.setFieldsValue({value:r.value}); setIsModalOpen(true)}}>Düzenle</Button>}]} rowKey="key" pagination={false} scroll={{x:600}} />
            <Modal open={isModalOpen} onCancel={()=>setIsModalOpen(false)} onOk={form.submit} width={800} destroyOnClose title={`Düzenle: ${editingItem?.key.replace(prefixFilter,'')}`} centered><Form form={form} onFinish={handleSave}><Form.Item name="value"><ReactQuill theme="snow" modules={quillModules} style={{height:300, marginBottom:50}} /></Form.Item></Form></Modal>
        </Card>
    );
};

// --- GENERIC USER MANAGER (KULLANICI LİSTESİ İÇİN) ---
const GenericUserManager = ({ title, data, columns, onAdd, onDelete, formFields, loading }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    
    const handleAddClick = () => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); };
    
    const handleEditClick = (record: any) => { 
        setEditingItem(record); 
        form.setFieldsValue(record); 
        setIsModalOpen(true); 
    };
    
    const handleSave = async (values: any) => { 
        await onAdd(values, editingItem); 
        setIsModalOpen(false); 
    };
    
    const enhancedColumns = [...columns, { title: 'İşlem', key: 'action', width: 100, align:'center' as const, render: (_:any, r: any) => (<Space><Button size="small" icon={<EditOutlined />} onClick={() => handleEditClick(r)} /><Popconfirm title="Sil?" onConfirm={() => onDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space>) }];
    
    return (
        <Card style={cardStyle} title={<Space><TeamOutlined style={{color:PRIMARY_COLOR}}/> {title}</Space>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} style={{backgroundColor: PRIMARY_COLOR}}>Ekle</Button>} styles={{ body: { padding: 24 } }}>
            <Table 
                dataSource={data} 
                columns={enhancedColumns} 
                rowKey="id" 
                scroll={{x: 600}} 
                size="middle" 
                loading={loading}
            />
            <Modal 
                title={editingItem ? "Düzenle" : "Ekle"} 
                open={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                onOk={form.submit}
                destroyOnClose 
                centered>
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{isActive: true}}>
                    {formFields}
                </Form>
            </Modal>
        </Card>
    );
};

// ============================================================================
// 7. ANA ADMIN PANEL (MAIN EXPORT)
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
    
    // --- CANLI VERİ STATE'LERİ ---
    const [users, setUsers] = useState<any[]>([]);
    const [therapists, setTherapists] = useState<any[]>([]);
    const [secretaries, setSecretaries] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingTherapists, setLoadingTherapists] = useState(false);
    const [loadingSecretaries, setLoadingSecretaries] = useState(false);
    
    // --- VERİ YÜKLEME FONKSİYONLARI (CANLI API) ---
    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await agent.Users.list(); 
            setUsers(data || []);
        } catch (e) {
            message.error('Kullanıcı listesi yüklenemedi. (API Hata)');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadTherapists = async () => {
        setLoadingTherapists(true);
        try {
            const data = await agent.Therapists.list(); 
            setTherapists(data || []);
        } catch (e) {
            message.error('Terapist listesi yüklenemedi. (API Hata)');
        } finally {
            setLoadingTherapists(false);
        }
    };

    const loadSecretaries = async () => {
        setLoadingSecretaries(true);
        try {
            const data = await agent.Secretaries.list(); 
            setSecretaries(data || []);
        } catch (e) {
            message.error('Sekreter listesi yüklenemedi. (API Hata)');
        } finally {
            setLoadingSecretaries(false);
        }
    };

    useEffect(() => {
        // İlgili tab aktif olduğunda veriyi çek
        if (activeTab === '2') loadUsers();
        if (activeTab === '3') loadTherapists();
        if (activeTab === '4') loadSecretaries();
    }, [activeTab]);
    
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
        { 
            key: 'definitions', 
            icon: <AppstoreOutlined />, 
            label: 'Tanımlamalar', 
            children: [
                { key: 'def-campus', icon: <BuildOutlined />, label: 'Kampüsler' },
                { key: 'def-types', icon: <IdcardOutlined />, label: 'Uzman Tipleri' },
                { key: 'def-roles', icon: <UnlockOutlined />, label: 'Roller' },
                { key: 'def-holidays', icon: <ScheduleOutlined />, label: 'Resmi Tatiller' },
            ]
        },
        { type: 'divider' },
        { key: 'therapist-view', icon: <MedicineBoxOutlined />, label: 'Terapist Paneli' },
        { key: 'secretary-view', icon: <CalendarOutlined />, label: 'Sekreter Paneli' },
        { type: 'divider' },
        { key: '1', icon: <FormOutlined />, label: 'İçerik Ayarları' },
        { key: '2', icon: <UserOutlined />, label: 'Kullanıcılar' },
        { key: '3', icon: <TeamOutlined />, label: 'Terapistler' },
        { key: '4', icon: <SolutionOutlined />, label: 'Sekreterler' }
    ];

    const MenuContent = () => (
        <Menu theme="dark" selectedKeys={[ ['student-detail', 'session-detail'].includes(activeTab) ? 'search' : activeTab ]} defaultOpenKeys={['definitions']} mode="inline" items={menuItems} onClick={(e) => handleMenuClick(e.key)} style={{border: 'none', background: 'transparent', fontFamily: BOUN_FONT}} />
    );

    return (
        <Layout style={{ height: '100%', minHeight: 'calc(100vh - 80px)', background: '#f5f7fa', fontFamily: BOUN_FONT }}>
            <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" collapsedWidth="80" onBreakpoint={(broken) => { if(broken) setCollapsed(true); }} width={250} theme="dark" style={{ background: '#001529', boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
                <div style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color:'white', fontWeight:'bold', fontSize: 16, fontFamily: BOUN_FONT }}>{collapsed ? 'YP' : 'YÖNETİM PANELİ'}</div>
                <MenuContent />
            </Sider>

            <Drawer title="Menü" placement="left" onClose={() => setMobileDrawerVisible(false)} open={mobileDrawerVisible} styles={{ body: { padding: 0, backgroundColor: '#001529' }, header: { display:'none' } }} width={240}>
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
                            {activeTab.startsWith('def-') && 'Sistem Tanımlamaları'}
                            {['1','2','3','4'].includes(activeTab) && 'Sistem Ayarları'}
                            {activeTab === 'therapist-view' && 'Terapist Paneli'}
                            {activeTab === 'secretary-view' && 'Sekreter Paneli'}
                        </span>
                    </div>
                </Header>
                
                <Content style={{ margin: '24px', overflowY: 'auto', minHeight: 280 }}>
                    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
                        {activeTab === '0' && <Dashboard />}
                        
                        {/* MODÜLLERİ ÇAĞIRMA (Yeni Dosyalar) */}
                        {activeTab === 'therapist-view' && <TherapistModule />}
                        {activeTab === 'secretary-view' && <SecretaryModule />}

                        {/* ÖĞRENCİ YÖNETİMİ */}
                        {activeTab === 'search' && <StudentSearchModule onViewStudent={handleViewStudent} />}
                        {activeTab === 'student-detail' && selectedStudentId && <StudentDetailModule studentId={selectedStudentId} onViewSession={handleViewSession} onBack={handleBackToSearch} />}
                        {activeTab === 'session-detail' && selectedSessionId && <SessionDetailModule sessionId={selectedSessionId} mode={sessionViewMode} onBack={handleBackToStudent} />}
                        
                        {/* TANIMLAMALAR */}
                        {activeTab === 'def-campus' && <DefinitionManager defaultTab="1" />}
                        {activeTab === 'def-types' && <DefinitionManager defaultTab="2" />}
                        {activeTab === 'def-roles' && <DefinitionManager defaultTab="3" />}
                        {activeTab === 'def-holidays' && <DefinitionManager defaultTab="4" />}

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

                        {/* KULLANICI YÖNETİMİ (Canlı API Bağlantısı) */}
                        {activeTab === '2' && (
                            <GenericUserManager 
                                title="Kullanıcı Listesi" 
                                data={users} 
                                loading={loadingUsers} 
                                columns={[
                                    { title: 'Kullanıcı Adı', dataIndex: 'userName' }, 
                                    { title: 'Email', dataIndex: 'email' }, 
                                    { title: 'Rol', dataIndex: 'userType', render: (r:string) => <Tag>{r || 'Rol Yok'}</Tag> },
                                    { title: 'Durum', dataIndex: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={async (v:any, old:any) => {
                                    try {
                                        if (old) await agent.Users.update(old.id, v);
                                        else await agent.Users.create(v);
                                        message.success(`Kullanıcı başarıyla ${old ? 'güncellendi' : 'eklendi'}.`);
                                        await loadUsers();
                                    } catch (e) {
                                        message.error('Kullanıcı işlemi başarısız oldu.');
                                    }
                                }} 
                                onDelete={async (id:any) => {
                                    try {
                                        await agent.Users.delete(id);
                                        message.success('Kullanıcı başarıyla silindi.');
                                        await loadUsers();
                                    } catch (e) {
                                        message.error('Silme işlemi başarısız oldu.');
                                    }
                                }}
                                formFields={
                                    <>
                                        <Form.Item name="userName" label="Kullanıcı Adı" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="email" label="Email" rules={[{required:true}]}><Input/></Form.Item>
                                        <Form.Item name="userType" label="Rol" rules={[{required:true}]}><Select><Option value="Admin">Admin</Option><Option value="Sekreter">Sekreter</Option><Option value="Terapist">Terapist</Option></Select></Form.Item>
                                        <Form.Item name="isActive" label="Durum" valuePropName="checked">
                                        <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                                    </Form.Item>
                                    </>
                                } 
                            />
                        )}
                        {/* TERAPİST YÖNETİMİ */}
                        {activeTab === '3' && (
                            <GenericUserManager 
                                title="Terapist Listesi" 
                                data={therapists} 
                                loading={loadingTherapists} 
                                columns={[
                                    { title: 'Unvan', dataIndex: 'title', width:80 }, 
                                    { title: 'Ad Soyad', render: (r:any)=>`${r.firstName} ${r.lastName}` }, 
                                    { title: 'Email', dataIndex: 'email' }, 
                                    { title: 'Durum', dataIndex: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={async (v:any, old:any) => {
                                    try {
                                        if (old) await agent.Therapists.update(old.id, v);
                                        else await agent.Therapists.create(v);
                                        message.success(`Terapist başarıyla ${old ? 'güncellendi' : 'eklendi'}.`);
                                        await loadTherapists();
                                    } catch (e) { message.error('İşlem başarısız.'); }
                                }} 
                                onDelete={async (id:any) => {
                                    try { await agent.Therapists.delete(id); message.success('Silindi.'); await loadTherapists(); } catch { message.error('Hata.'); }
                                }}
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
                        {/* SEKRETER YÖNETİMİ */}
                        {activeTab === '4' && (
                            <GenericUserManager 
                                title="Sekreter Listesi" 
                                data={secretaries} 
                                loading={loadingSecretaries} 
                                columns={[
                                    { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
                                    { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
                                    { title: 'Email', dataIndex: 'email', key: 'email' },
                                    { title: 'Rol', dataIndex: 'userType', render: (t:string) => <Tag color="blue">{t}</Tag> },
                                    { title: 'Durum', dataIndex: 'isActive', key: 'isActive', render: (a:boolean)=>(a?<Tag color="green">Aktif</Tag>:<Tag color="red">Pasif</Tag>) }
                                ]} 
                                onAdd={async (v:any, old:any) => {
                                    try {
                                        // Sekreterler de aslında birer User olduğu için Users endpointi kullanılabilir veya özel endpoint
                                        // Burada admin panelindeki mantığa göre Users üzerinden işlem yapıyoruz
                                        const payload = { ...v, userType: 'Sekreter' };
                                        if (old) await agent.Users.update(old.id, payload);
                                        else await agent.Users.create(payload);
                                        message.success(`İşlem başarılı.`);
                                        await loadSecretaries();
                                    } catch (e) { message.error('Hata.'); }
                                }} 
                                onDelete={async (id:any) => {
                                    try { await agent.Users.delete(id); message.success('Silindi.'); await loadSecretaries(); } catch { message.error('Hata.'); }
                                }}
                                formFields={
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}><Form.Item name="firstName" label="Ad" rules={[{required:true}]}><Input /></Form.Item></Col>
                                            <Col span={12}><Form.Item name="lastName" label="Soyad" rules={[{required:true}]}><Input /></Form.Item></Col>
                                        </Row>
                                        <Form.Item name="userName" label="Kullanıcı Adı" rules={[{required:true}]}><Input /></Form.Item>
                                        <Form.Item name="email" label="Email" rules={[{required:true, type:'email'}]}><Input prefix={<UserOutlined />} /></Form.Item>
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