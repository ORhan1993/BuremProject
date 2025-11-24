import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import agent from '../../api/agent';
import type { SiteContent, Question, User, Therapist, DashboardStats } from '../../api/agent';
import { Layout, Menu, Table, Button, Modal, Form, Input, Tabs, message, Card, Select, Popconfirm, Tag, Space, Switch, Row, Col, Statistic } from 'antd';
import { FormOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined, EditOutlined, UserOutlined, TeamOutlined, SearchOutlined, DashboardOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const { Header, Content, Sider } = Layout;
const { Option } = Select;

const quillModules = { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'clean'] ] };

// ============================================================================
// YENİ: DASHBOARD BİLEŞENİ
// ============================================================================
const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        agent.Stats.getDashboard()
            .then(setStats)
            .catch(() => {
                // API henüz hazır değilse örnek veri göster
                setStats({ totalStudents: 120, totalSessions: 450, todaySessions: 5, pendingForms: 2 });
            });
    }, []);

    if (!stats) return <div style={{padding:20}}>Veriler Yükleniyor...</div>;

    return (
        <div style={{ padding: 0 }}>
            <Row gutter={16}>
                <Col span={6}>
                    <Card bordered={false} style={{borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                        <Statistic title="Toplam Öğrenci" value={stats.totalStudents} prefix={<UserOutlined style={{color:'#1890ff'}} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                        <Statistic title="Toplam Başvuru" value={stats.totalSessions} prefix={<FormOutlined style={{color:'#722ed1'}} />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                        <Statistic title="Bugünkü Başvurular" value={stats.todaySessions} valueStyle={{ color: '#3f8600' }} prefix={<TeamOutlined />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} style={{borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                        <Statistic title="Bekleyen Formlar" value={stats.pendingForms} valueStyle={{ color: '#cf1322' }} prefix={<SearchOutlined />} />
                    </Card>
                </Col>
            </Row>
            
            <div style={{marginTop: 25, padding: 20, background: '#fff', borderRadius: 8, border:'1px solid #f0f0f0'}}>
                <h3 style={{color:'#003366'}}>Hoş Geldiniz</h3>
                <p style={{color:'#666'}}>Sol menüden öğrenci arama, içerik yönetimi ve kullanıcı işlemlerini gerçekleştirebilirsiniz.</p>
            </div>
        </div>
    );
};

// ============================================================================
// 1. İÇERİK YÖNETİMİ
// ============================================================================
const ContentEditor = ({ prefixFilter, title }: { prefixFilter: string, title: string }) => {
    const [contents, setContents] = useState<SiteContent[]>([]);
    const [editingItem, setEditingItem] = useState<SiteContent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const loadContent = async () => {
        try {
            const res = await agent.Content.getAll();
            setContents(res.filter(c => c.key.startsWith(prefixFilter)));
        } catch { 
            // Hata durumunda boş kalmasın
            setContents([{ key: prefixFilter+'Test', value: '<p>Örnek veri</p>' }]);
        }
    };

    useEffect(() => { loadContent(); }, []);

    useEffect(() => {
        if (isModalOpen && editingItem) {
            form.resetFields(); 
            setTimeout(() => form.setFieldsValue({ value: editingItem.value }), 100);
        }
    }, [isModalOpen, editingItem, form]);

    const handleSave = async (values: any) => {
        try {
            if (!editingItem) return;
            await agent.Content.update({ key: editingItem.key, value: values.value });
            message.success('Güncellendi');
            setIsModalOpen(false);
            setEditingItem(null);
            loadContent();
        } catch { message.error('Hata'); }
    };

    const stripHtml = (html: string) => { const tmp = document.createElement("DIV"); tmp.innerHTML = html; return tmp.textContent || tmp.innerText || ""; };
    const columns = [ { title: 'Alan', dataIndex: 'key', width: 250, render: (t:string) => <b>{t.replace(prefixFilter, '')}</b> }, { title: 'İçerik', dataIndex: 'value', ellipsis: true, render: (val: string) => <span style={{color:'#666'}}>{stripHtml(val)}</span> }, { title: 'İşlem', width: 120, render: (_: any, r: SiteContent) => <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => { setEditingItem(r); setIsModalOpen(true); }}>Düzenle</Button> } ];
    
    return ( <Card title={title}> <Table dataSource={contents} columns={columns} rowKey="key" pagination={false} size="small" /> <Modal title="Düzenle" open={isModalOpen} onCancel={() => {setIsModalOpen(false); setEditingItem(null);}} onOk={form.submit} width={900} destroyOnClose forceRender> <Form form={form} onFinish={handleSave} layout="vertical" preserve={false}><Form.Item name="value" label="İçerik" rules={[{ required: true }]}><ReactQuill theme="snow" modules={quillModules} style={{height:300, marginBottom:50}} /></Form.Item></Form> </Modal> </Card> );
};

// ============================================================================
// 2. SORU YÖNETİMİ
// ============================================================================
const QuestionManager = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const loadQuestions = async () => {
        setLoading(true);
        try { const res = await agent.Forms.listQuestions(); setQuestions(res); } catch { setQuestions([]); } finally { setLoading(false); }
    };
    useEffect(() => { loadQuestions(); }, []);

    const handleEdit = (q: Question) => {
        const optionsString = q.options ? q.options.map(o => o.optionValue).join(', ') : '';
        const group = (!q.questionGroup || q.questionGroup === 0) ? 1 : q.questionGroup;
        setEditingItem({ ...q, options: optionsString, questionGroup: group });
        setIsModalOpen(true);
    };
    const handleAdd = () => {
        setEditingItem({ id: 0, questionType: 2, questionGroup: 1, sortOrder: questions.length + 1, questionTitle: '', options: '' });
        setIsModalOpen(true);
    };
    const handleSubmit = async (values: any) => {
        const dto = {
            id: editingItem.id,
            questionTitle: values.questionTitle,
            questionType: values.questionType,
            sortOrder: parseInt(values.sortOrder),
            questionGroup: parseInt(values.questionGroup),
            options: values.options ? values.options.split(',').map((opt:string, i:number) => ({ optionTitle: opt.trim(), optionValue: opt.trim(), sortOrder: i })) : []
        };
        try {
            await agent.Forms.createQuestion(dto);
            message.success(editingItem.id ? "Güncellendi" : "Eklendi");
            setIsModalOpen(false);
            loadQuestions();
        } catch { message.error("Hata"); }
    };

    const getGroupTag = (id: number) => {
        const safeId = (!id || id === 0) ? 1 : id;
        if(safeId === 1) return <Tag color="blue">Genel Durum</Tag>;
        if(safeId === 2) return <Tag color="orange">Kaygı</Tag>;
        if(safeId === 3) return <Tag color="red">Depresyon</Tag>;
        return <Tag>Tanımsız</Tag>;
    };

    const columns = [
        { title: 'Grup', dataIndex: 'questionGroup', width: 150, render: (id:number) => getGroupTag(id), sorter: (a:any,b:any)=>(a.questionGroup||0)-(b.questionGroup||0), defaultSortOrder: 'ascend' as const },
        { title: 'Sıra', dataIndex: 'sortOrder', width: 70 },
        { title: 'Soru', dataIndex: 'questionTitle', ellipsis: true },
        { title: 'Tip', dataIndex: 'questionType', width: 80, render: (t:number) => t===1?'Metin':t===2?'Tek':'Çoklu' },
        { title: 'İşlem', width: 100, render: (_:any, r:Question) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} /><Popconfirm title="Sil?" onConfirm={async () => { await agent.Forms.deleteQuestion(r.id); loadQuestions(); }}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space> }
    ];

    return (
        <Card title="Sorular" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Ekle</Button>}>
            <Table dataSource={questions} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} loading={loading} size="small" />
            <Modal title={editingItem?.id !== 0 ? "Düzenle" : "Ekle"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
                {isModalOpen && editingItem && (
                    <Form key={editingItem.id ? `edit-${editingItem.id}` : 'new'} layout="vertical" onFinish={handleSubmit} initialValues={editingItem}>
                        <Space><Form.Item name="questionGroup" label="Sayfa" rules={[{required:true}]}><Select style={{width:200}}><Option value={1}>Genel Durum</Option><Option value={2}>Kaygı</Option><Option value={3}>Depresyon</Option></Select></Form.Item><Form.Item name="sortOrder" label="Sıra" rules={[{required:true}]}><Input type="number"/></Form.Item></Space>
                        <Form.Item name="questionTitle" label="Soru" rules={[{required:true}]}><Input.TextArea rows={2}/></Form.Item>
                        <Form.Item name="questionType" label="Tip" rules={[{required:true}]}><Select><Option value={1}>Metin</Option><Option value={2}>Tek Seçim</Option><Option value={3}>Çoklu Seçim</Option></Select></Form.Item>
                        <Form.Item noStyle shouldUpdate={(p, c) => p.questionType !== c.questionType}>{({ getFieldValue }) => getFieldValue('questionType') !== 1 && <Form.Item name="options" label="Seçenekler (Virgülle ayır)"><Input.TextArea /></Form.Item>}</Form.Item>
                        <div style={{textAlign:'right', marginTop:20}}><Space><Button onClick={()=>setIsModalOpen(false)}>İptal</Button><Button type="primary" htmlType="submit">Kaydet</Button></Space></div>
                    </Form>
                )}
            </Modal>
        </Card>
    );
};

// --- 3. KULLANICI YÖNETİMİ ---
const UserManager = () => {
    const [users, setUsers] = useState<User[]>([]); const [open, setOpen] = useState(false); const [item, setItem] = useState<any>(null);
    useEffect(()=>{setUsers([{id:'1',userName:'admin',email:'admin@boun.edu.tr',role:'Admin'},{id:'2',userName:'ogr',email:'ogr@boun.edu.tr',role:'Student'}])},[]);
    const handleEdit = (u:any) => { setItem(u); setOpen(true); };
    return <Card title="Kullanıcılar" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setItem({});setOpen(true)}}>Ekle</Button>}><Table dataSource={users} columns={[{title:'Kullanıcı',dataIndex:'userName'},{title:'Rol',dataIndex:'role'},{title:'İşlem',render:(_:any,r:any)=><Button size="small" icon={<EditOutlined/>} onClick={()=>handleEdit(r)}/>}]} rowKey="id"/><Modal open={open} onCancel={()=>setOpen(false)} footer={null} destroyOnClose>{open && item && <Form layout="vertical" initialValues={item} onFinish={()=>{message.success('Kaydedildi');setOpen(false)}} key={item.id||'new'}><Form.Item name="userName" label="Ad"><Input/></Form.Item><Form.Item name="email" label="Email"><Input/></Form.Item><Button type="primary" htmlType="submit">Kaydet</Button></Form>}</Modal></Card>;
};

// --- 4. TERAPİST YÖNETİMİ ---
const TherapistManager = () => {
    const [data, setData] = useState<Therapist[]>([{id:1,firstName:'Ayşe',lastName:'Yılmaz',email:'a@b.c',title:'Psk.',isActive:true}]); const [open, setOpen] = useState(false); const [item, setItem] = useState<any>(null);
    const handleEdit = (t:any) => { setItem(t); setOpen(true); };
    return <Card title="Terapistler" extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setItem({isActive:true});setOpen(true)}}>Ekle</Button>}><Table dataSource={data} columns={[{title:'Ad Soyad',render:(r:any)=>r.firstName+' '+r.lastName},{title:'Email',dataIndex:'email'},{title:'İşlem',render:(_:any,r:any)=><Button size="small" icon={<EditOutlined/>} onClick={()=>handleEdit(r)}/>}]} rowKey="id"/><Modal open={open} onCancel={()=>setOpen(false)} footer={null} destroyOnClose>{open && item && <Form layout="vertical" initialValues={item} onFinish={()=>{message.success('Kaydedildi');setOpen(false)}} key={item.id||'new'}><Form.Item name="firstName" label="Ad"><Input/></Form.Item><Form.Item name="lastName" label="Soyad"><Input/></Form.Item><Button type="primary" htmlType="submit">Kaydet</Button></Form>}</Modal></Card>;
};

// ============================================================================
// ANA PANEL LAYOUT
// ============================================================================
const AdminPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('0'); // 0: Dashboard
    const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

    // Menü Yapısı (Dashboard Eklendi, IP Çıkarıldı)
    const menuItems = [
        { key: '0', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'search', icon: <SearchOutlined />, label: 'Öğrenci Arama' },
        { type: 'divider' },
        { key: '1', icon: <FormOutlined />, label: 'İçerik Yönetimi' },
        { key: '2', icon: <UserOutlined />, label: 'Kullanıcılar' },
        { key: '3', icon: <TeamOutlined />, label: 'Terapistler' }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider theme="dark" collapsible breakpoint="lg">
                <div style={{ height: 32, margin: 16, color:'white', textAlign:'center', fontWeight:'bold', lineHeight:'32px', letterSpacing:1 }}>BÜREM ADMIN</div>
                <Menu 
                    theme="dark" 
                    defaultSelectedKeys={['0']} 
                    mode="inline" 
                    items={menuItems}
                    onClick={(e) => { 
                        if(e.key === 'search') navigate('/admin/search');
                        else setActiveTab(e.key);
                    }} 
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)' }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color:'#003366' }}>Yönetim Paneli</span>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Yenile</Button>
                        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Çıkış</Button>
                    </Space>
                </Header>
                <Content style={{ margin: '24px' }}>
                    {/* Tab yapısı yerine ActiveTab'a göre render */}
                    {activeTab === '0' && <Dashboard />}
                    
                    {activeTab === '1' && (
                        <Tabs defaultActiveKey="1" type="card" items={[
                            { key: '1', label: 'Duyuru Ekranı', children: <ContentEditor prefixFilter="Announcement_" title="Giriş Popup Ayarları" /> },
                            { key: '2', label: 'Onam Formu', children: <ContentEditor prefixFilter="Consent_" title="Onam Metni Ayarları" /> },
                            { key: '3', label: 'Soru Listesi', children: <QuestionManager /> }
                        ]} />
                    )}

                    {activeTab === '2' && <UserManager />}
                    {activeTab === '3' && <TherapistManager />}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminPanel;