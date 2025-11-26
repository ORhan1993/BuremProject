import { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, message, Tag, Space, Popconfirm, Typography, Avatar } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import agent from '../../api/agent'; // Backend API bağlantısı

const { Title, Text } = Typography;
const PRIMARY_COLOR = '#1B5583';

const SecretariesPage = () => {
    // State tanımları
    const [secretaries, setSecretaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- VERİ YÜKLEME ---
    const loadSecretaries = async () => {
        setLoading(true);
        try {
            // Gerçek uygulamada: const users = await agent.Users.list();
            // Şimdilik simüle edilmiş veri:
            const mockUsers = [
                { id: '1', userName: 'ayse.yilmaz', email: 'ayse.yilmaz@boun.edu.tr', role: 'secretary', createdAt: '12.01.2024' },
                { id: '2', userName: 'fatma.demir', email: 'fatma.demir@boun.edu.tr', role: 'secretary', createdAt: '15.02.2024' },
                { id: '3', userName: 'danisma.merkez', email: 'danisma@boun.edu.tr', role: 'secretary', createdAt: '01.03.2024' },
            ];
            
            // API entegre edildiğinde burayı açın:
            // const users = await agent.Users.list();
            // const filtered = users.filter((u: any) => u.role === 'secretary');
            // setSecretaries(filtered);
            
            setSecretaries(mockUsers);
        } catch (error) {
            message.error('Sekreter listesi yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSecretaries();
    }, []);

    // --- EKLEME İŞLEMİ ---
    const handleAdd = async (values: any) => {
        try {
            // API isteği simülasyonu
            const newUser = { 
                ...values, 
                role: 'secretary',
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toLocaleDateString('tr-TR')
            };
            
            // await agent.Users.create(newUser);
            
            setSecretaries([...secretaries, newUser]); // State güncelleme
            message.success('Sekreter hesabı başarıyla oluşturuldu.');
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            message.error('Hesap oluşturulamadı.');
        }
    };

    // --- SİLME İŞLEMİ ---
    const handleDelete = async (id: string) => {
        try {
            // await agent.Users.delete(id);
            setSecretaries(secretaries.filter(s => s.id !== id));
            message.success('Sekreter hesabı silindi.');
        } catch (error) {
            message.error('Silme işlemi başarısız.');
        }
    };

    // Tablo Kolonları
    const columns = [
        {
            title: 'Kullanıcı',
            dataIndex: 'userName',
            key: 'userName',
            render: (text: string) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }} icon={<UserOutlined />} />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: 'E-posta Adresi',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Kayıt Tarihi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <span style={{ color: '#888' }}>{date}</span>
        },
        {
            title: 'Durum',
            key: 'status',
            render: () => <Tag color="green">Aktif</Tag>
        },
        {
            title: 'İşlemler',
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                     <Button size="small" icon={<EditOutlined />}>Düzenle</Button>
                     <Popconfirm 
                        title="Bu hesabı silmek istediğinize emin misiniz?" 
                        okText="Evet"
                        cancelText="Hayır"
                        onConfirm={() => handleDelete(record.id)}
                     >
                        <Button danger size="small" icon={<DeleteOutlined />} />
                     </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ color: PRIMARY_COLOR, margin: 0 }}>Sekreter Yönetimi</h2>
                    <Text type="secondary">Sisteme erişimi olan sekreterleri yönetin.</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsModalVisible(true)} 
                    size="large"
                    style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, borderRadius: 6 }}
                >
                    Yeni Sekreter Ekle
                </Button>
            </div>

            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table
                    columns={columns}
                    dataSource={secretaries}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            {/* --- EKLEME MODALI --- */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: PRIMARY_COLOR }}>
                        <UserAddOutlined style={{ fontSize: 20 }} /> 
                        <span>Yeni Sekreter Hesabı</span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 20 }}>
                    <Form.Item 
                        name="userName" 
                        label="Kullanıcı Adı" 
                        rules={[{ required: true, message: 'Lütfen kullanıcı adı giriniz.' }]}
                    >
                        <Input placeholder="Örn: isim.soyisim" />
                    </Form.Item>
                    
                    <Form.Item 
                        name="email" 
                        label="E-posta Adresi" 
                        rules={[
                            { required: true, message: 'Lütfen e-posta giriniz.' },
                            { type: 'email', message: 'Geçerli bir e-posta giriniz.' }
                        ]}
                    >
                        <Input placeholder="Örn: sekreter@boun.edu.tr" />
                    </Form.Item>
                    
                    <Form.Item 
                        name="password" 
                        label="Geçici Şifre" 
                        rules={[{ required: true, message: 'Lütfen şifre belirleyiniz.' }]}
                    >
                        <Input.Password placeholder="********" />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                        <Button onClick={() => setIsModalVisible(false)}>İptal</Button>
                        <Button type="primary" htmlType="submit" style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
                            Kaydet
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default SecretariesPage;