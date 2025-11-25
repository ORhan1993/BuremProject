import { useState } from 'react';
import { Layout, Input, Button, Card, Row, Col, Table, message, Collapse, Form, Select, DatePicker, InputNumber, Space } from 'antd';
import { SearchOutlined, LogoutOutlined, ArrowLeftOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import agent from '../api/agent';
import type { StudentProfileDetail } from '../api/agent';

const { Header, Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StudentSearchPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentProfileDetail[]>([]);
    const [form] = Form.useForm();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleSearch = async (values: any) => {
        setLoading(true);
        try {
            const formattedValues = {
                ...values,
                sessionDateStart: values.sessionDateRange ? values.sessionDateRange[0].format('DD.MM.YYYY') : '',
                sessionDateFinish: values.sessionDateRange ? values.sessionDateRange[1].format('DD.MM.YYYY') : '',
                birthDateStart: values.birthDateRange ? values.birthDateRange[0].format('DD.MM.YYYY') : '',
                birthDateFinish: values.birthDateRange ? values.birthDateRange[1].format('DD.MM.YYYY') : '',
                sessionDateRange: undefined,
                birthDateRange: undefined
            };

            const data = await agent.Students.searchAdvanced(formattedValues);
            setResults(data || []);
            
            if (data && data.length > 0) {
                message.success(`${data.length} öğrenci bulundu.`);
            } else {
                message.warning("Kriterlere uygun kayıt bulunamadı.");
            }

        } catch (error) {
            message.error("Arama sırasında bir hata oluştu.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        setResults([]);
    };

    const columns = [
        { 
            title: 'Öğrenci No', 
            dataIndex: 'studentNo', 
            key: 'studentNo', 
            width: 120, 
            render: (t: string) => <b>{t}</b> 
        },
        { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
        { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
        { title: 'Fakülte', dataIndex: 'faculty', key: 'faculty', ellipsis: true },
        { title: 'Bölüm', dataIndex: 'department', key: 'department', ellipsis: true },
        { title: 'Akademik Düzey', dataIndex: 'academicLevel', key: 'academicLevel', width: 140 },
        { 
            title: 'İşlem', 
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: StudentProfileDetail) => (
                <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => navigate(`/admin/student/${record.id}`)} 
                >
                    Detay
                </Button>
            )
        }
    ];

    // Collapse Items Tanımlaması (Antd v5)
    const collapseItems = [
        {
            key: '1',
            label: <span style={{fontWeight:600, color:'#003366'}}><FilterOutlined /> Gelişmiş Arama Kriterleri</span>,
            children: (
                <Form form={form} onFinish={handleSearch} layout="vertical">
                    {/* Satır 1: Temel Bilgiler */}
                    <Row gutter={16}>
                        <Col xs={24} md={6}><Form.Item name="studentNo" label="Öğrenci No"><Input placeholder="Örn: 2020..." /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="firstName" label="Ad"><Input /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="lastName" label="Soyad"><Input /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="gender" label="Cinsiyet"><Select allowClear><Option value="1">Erkek</Option><Option value="2">Kadın</Option></Select></Form.Item></Col>
                    </Row>

                    {/* Satır 2: Akademik */}
                    <Row gutter={16}>
                        <Col xs={24} md={8}><Form.Item name="faculty" label="Fakülte"><Input placeholder="Fakülte Adı" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="department" label="Bölüm"><Input placeholder="Bölüm Adı" /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="academicLevel" label="Akademik Düzey"><Select allowClear><Option value="LISANS">Lisans</Option><Option value="YUKSEK">Yüksek Lisans</Option><Option value="DOKTORA">Doktora</Option><Option value="HAZIRLIK">Hazırlık</Option></Select></Form.Item></Col>
                    </Row>

                    {/* Satır 3: Detaylar ve Tarihler */}
                    <Row gutter={16}>
                        <Col xs={24} md={6}><Form.Item name="sessionDateRange" label="Başvuru Tarihi Aralığı"><RangePicker format="DD.MM.YYYY" style={{width:'100%'}} /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="gpaStart" label="Min. Not Ort. (GPA)"><InputNumber style={{width:'100%'}} step="0.01" min={0} max={4} /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="olcekTipi" label="Ölçek Tipi"><Select allowClear><Option value="1">Genel</Option><Option value="2">Kaygı</Option><Option value="3">Depresyon</Option></Select></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="semesterMin" label="Min. Dönem"><InputNumber style={{width:'100%'}} min={1} /></Form.Item></Col>
                    </Row>
                    
                    {/* Butonlar */}
                    <Row justify="end" style={{ marginTop: 10 }}>
                        <Space>
                            <Button icon={<ClearOutlined />} onClick={handleReset}>Temizle</Button>
                            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>Ara</Button>
                        </Space>
                    </Row>
                </Form>
            ),
            style: { background: '#fff', borderRadius: 8 }
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            
            {/* HEADER */}
            <Header style={{ background: '#003366', padding: '0 24px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap:15 }}>
                    <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>BÜREM</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
                    <span style={{ color: 'white', fontSize: 14 }}>Öğrenci Arama & Filtreleme</span>
                </div>
                <Space>
                    <Button type="text" style={{color:'white'}} icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>Panele Dön</Button>
                    <Button type="text" style={{color:'#ffccc7'}} icon={<LogoutOutlined />} onClick={handleLogout}>Çıkış</Button>
                </Space>
            </Header>

            <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                
                {/* 1. ARAMA FORMU (Accordion içinde) */}
                <Collapse 
                    defaultActiveKey={['1']} 
                    style={{ marginBottom: 20, borderRadius: 8, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    items={collapseItems}
                />

                {/* 2. SONUÇ TABLOSU */}
                <Card 
                    title={`Arama Sonuçları (${results.length} Kayıt)`} 
                    style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table 
                        dataSource={results} 
                        columns={columns} 
                        rowKey="id" 
                        loading={loading}
                        pagination={{ pageSize: 10, showSizeChanger: true }} 
                        locale={{ emptyText: 'Kriterlere uygun veri bulunamadı.' }}
                    />
                </Card>

            </Content>
        </Layout>
    );
};

export default StudentSearchPage;