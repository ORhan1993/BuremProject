import { useState } from 'react';
import { Form, Input, Button, Table, Card, Row, Col, DatePicker, Select, Tag, Tooltip, InputNumber } from 'antd';
import { SearchOutlined, UserOutlined, EyeOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import agent from '../api/agent';

const { Option } = Select;

// Boğaziçi Mavisi
const PRIMARY_COLOR = '#1B5583';

const StudentSearchPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // İkinci koddaki mantıkla tarih formatlama
            const formattedValues = {
                ...values,
                sessionDateStart: values.dateRange ? values.dateRange[0].format('DD.MM.YYYY') : '',
                sessionDateFinish: values.dateRange ? values.dateRange[1].format('DD.MM.YYYY') : '',
                // dateRange objesini API'ye göndermemek için siliyoruz veya undefined yapıyoruz
                dateRange: undefined
            };
            
            // API çağrısı
            const result = await agent.Students.searchAdvanced(formattedValues);
            setStudents(result || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        setStudents([]);
    };

    const columns = [
        { 
            title: 'Öğrenci No', 
            dataIndex: 'studentNo', 
            key: 'studentNo', 
            width: 120,
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>
        },
        { title: 'Ad', dataIndex: 'firstName', key: 'firstName' },
        { title: 'Soyad', dataIndex: 'lastName', key: 'lastName' },
        { title: 'Fakülte', dataIndex: 'faculty', key: 'faculty', responsive: ['md'] as any },
        { title: 'Bölüm', dataIndex: 'department', key: 'department', responsive: ['lg'] as any },
        { title: 'Akademik', dataIndex: 'academicLevel', key: 'academicLevel', width: 100, responsive: ['xl'] as any },
        { 
            title: 'Durum', 
            dataIndex: 'sessions', 
            key: 'sessionCount', 
            render: (sessions: any[]) => <Tag color={sessions?.length > 0 ? "blue" : "default"}>{sessions?.length || 0} Başvuru</Tag>
        },
        {
            title: 'İşlem',
            key: 'action',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Tooltip title="Profili Görüntüle">
                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<EyeOutlined />} 
                        style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
                        onClick={() => navigate(`/admin/student/${record.id}`)} 
                    />
                </Tooltip>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ color: PRIMARY_COLOR, margin: 0 }}>Öğrenci Arama ve Sorgulama</h2>
                <span style={{ color: '#666' }}>Tüm kriterlere göre detaylı öğrenci taraması yapabilirsiniz.</span>
            </div>

            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 24 }}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    {/* 1. SATIR: Temel Kimlik Bilgileri */}
                    <Row gutter={24}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="studentNo" label="Öğrenci Numarası">
                                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Örn: 2023..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="firstName" label="Ad">
                                <Input placeholder="Ad" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="lastName" label="Soyad">
                                <Input placeholder="Soyad" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="gender" label="Cinsiyet">
                                <Select allowClear placeholder="Seçiniz">
                                    <Option value="1">Erkek</Option>
                                    <Option value="2">Kadın</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* 2. SATIR: Akademik Bilgiler */}
                    <Row gutter={24}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="faculty" label="Fakülte">
                                <Input placeholder="Fakülte Adı" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="department" label="Bölüm">
                                <Input placeholder="Bölüm Adı" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="academicLevel" label="Akademik Düzey">
                                <Select allowClear placeholder="Seçiniz">
                                    <Option value="LISANS">Lisans</Option>
                                    <Option value="YUKSEK">Yüksek Lisans</Option>
                                    <Option value="DOKTORA">Doktora</Option>
                                    <Option value="HAZIRLIK">Hazırlık</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="dateRange" label="Başvuru Tarih Aralığı">
                                <DatePicker.RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} placeholder={['Başlangıç', 'Bitiş']} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* 3. SATIR: Detay Filtreler (GPA, Ölçek vb.) */}
                    <Row gutter={24}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="gpaStart" label="Min. Not Ort. (GPA)">
                                <InputNumber style={{ width: '100%' }} step="0.01" min={0} max={4} placeholder="0.00" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="semesterMin" label="Min. Dönem">
                                <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="olcekTipi" label="Ölçek Tipi">
                                <Select allowClear placeholder="Filtrele">
                                    <Option value="1">Genel</Option>
                                    <Option value="2">Kaygı</Option>
                                    <Option value="3">Depresyon</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        {/* Butonlar için son sütun */}
                        <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <Form.Item style={{ width: '100%' }}>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <Button onClick={handleReset} icon={<ClearOutlined />} style={{ flex: 1 }}>
                                        Temizle
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        icon={<SearchOutlined />} 
                                        loading={loading} 
                                        style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, flex: 1.5 }}
                                    >
                                        Ara
                                    </Button>
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* SONUÇ TABLOSU */}
            {students && students.length > 0 ? (
                <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <Table 
                        dataSource={students} 
                        columns={columns} 
                        rowKey="id" 
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                </Card>
            ) : (
                loading ? null : <div style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>Arama yapmak için kriter giriniz veya sonuç bulunamadı.</div>
            )}
        </div>
    );
};

export default StudentSearchPage;