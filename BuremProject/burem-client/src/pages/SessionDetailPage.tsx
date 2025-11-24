import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Card, Form, Input, Radio, Button, Spin, message, Descriptions, Tag, Space, Divider, Modal, Steps, Select, DatePicker, Alert, Table } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, EditOutlined, UserAddOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { SessionDetailDTO, TherapistAvailability } from '../api/agent';

// NOT: 'moment' importu kaldırıldı çünkü Ant Design v5 Dayjs kullanır ve
// values.date.format() metodunu doğrudan destekler.

const { Header, Content } = Layout;
const { Step } = Steps;
const { Option } = Select;

// ============================================================================
// ALT BİLEŞEN: RANDEVU VE ATAMA MODALI (WIZARD)
// ============================================================================
interface AppointmentModalProps {
    visible: boolean;
    onCancel: () => void;
    sessionId: number;
    studentName: string;
}

const AppointmentModal = ({ visible, onCancel, sessionId, studentName }: AppointmentModalProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistAvailability | null>(null);
    const [form] = Form.useForm();

    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            setTherapists(data);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await agent.Appointments.create({
                sessionId,
                therapistId: selectedTherapist!.id,
                // Ant Design v5 DatePicker 'Dayjs' objesi döner, .format() metodu vardır.
                date: values.date ? values.date.format('DD.MM.YYYY') : '',
                time: values.time,
                type: values.type,
                roomLink: values.roomLink
            });

            message.success('Randevu oluşturuldu ve öğrenciye e-posta gönderildi.');
            onCancel();
            setCurrentStep(0);
            form.resetFields();
            setSelectedTherapist(null);
            setTherapists([]);
        } catch (error) {
            message.error('İşlem başarısız.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Uzman', dataIndex: 'name', key: 'name' },
        { title: 'Kampüs', dataIndex: 'campus', key: 'campus', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Yük', dataIndex: 'currentLoad', key: 'load' },
        { title: 'Boş Slot', dataIndex: 'dailySlots', key: 'slots' },
        { title: 'Günler', dataIndex: 'workingDays', key: 'days', render: (days: string[]) => days.join(', ') },
        {
            title: 'Seç',
            key: 'action',
            render: (_: any, record: TherapistAvailability) => (
                <Button size="small" type={selectedTherapist?.id === record.id ? 'primary' : 'default'} onClick={() => setSelectedTherapist(record)}>
                    {selectedTherapist?.id === record.id ? 'Seçildi' : 'Seç'}
                </Button>
            )
        }
    ];

    return (
        <Modal
            title="Terapiste Yönlendir ve Randevu Oluştur"
            open={visible}
            onCancel={onCancel}
            width={900}
            footer={null}
            destroyOnClose
            maskClosable={false}
        >
            <Steps current={currentStep} style={{ marginBottom: 25 }}>
                <Step title="Uzman Seçimi" icon={<UserOutlined />} />
                <Step title="Zaman & Yer" icon={<CalendarOutlined />} />
                <Step title="Onay" icon={<CheckCircleOutlined />} />
            </Steps>

            <Form form={form} layout="vertical">
                {currentStep === 0 && (
                    <div>
                        <Alert message="Lütfen önce uzman kategorisini seçiniz." type="info" showIcon style={{marginBottom:15}} />
                        <Form.Item label="Uzman Kategorisi" style={{marginBottom: 15}}>
                            <Select placeholder="Kategori Seçin" onChange={handleCategoryChange}>
                                <Option value="BÜREM Uzmanı">BÜREM Uzmanları</Option>
                                <Option value="Deneyimli Uzman">Deneyimli Uzman</Option>
                                <Option value="Gönüllü Uzman">Gönüllü Uzman</Option>
                                <Option value="İndirimli">İndirimli Uzman</Option>
                            </Select>
                        </Form.Item>

                        <Table 
                            dataSource={therapists} 
                            columns={columns} 
                            rowKey="id" 
                            pagination={false} 
                            size="small"
                            loading={loading}
                            locale={{emptyText: 'Kategori seçiniz.'}}
                            scroll={{ y: 240 }}
                        />
                        
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button type="primary" disabled={!selectedTherapist} onClick={() => setCurrentStep(1)}>İleri</Button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div>
                        <Descriptions title="Seçilen Uzman Bilgileri" size="small" bordered style={{marginBottom: 20}}>
                            <Descriptions.Item label="Ad Soyad">{selectedTherapist?.name}</Descriptions.Item>
                            <Descriptions.Item label="Kampüs">{selectedTherapist?.campus}</Descriptions.Item>
                            <Descriptions.Item label="Çalışma Günleri">{selectedTherapist?.workingDays.join(', ')}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <Form.Item name="date" label="Randevu Tarihi" rules={[{ required: true }]} style={{ flex: 1 }}>
                                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" placeholder="Tarih Seçin" />
                            </Form.Item>
                            <Form.Item name="time" label="Randevu Saati" rules={[{ required: true }]} style={{ flex: 1 }}>
                                <Select placeholder="Saat Seçiniz">
                                    {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </Form.Item>
                        </div>

                        <Form.Item name="type" label="Görüşme Türü" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="Yüz Yüze">Yüz Yüze</Radio>
                                <Radio value="Online">Online</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                            {({ getFieldValue }) => (
                                <Form.Item 
                                    name="roomLink" 
                                    label={getFieldValue('type') === 'Online' ? "Zoom/Meet Linki" : "Görüşme Odası"} 
                                    rules={[{ required: true }]}
                                >
                                    {getFieldValue('type') === 'Online' 
                                        ? <Input placeholder="https://zoom.us/..." />
                                        : <Select placeholder="Oda Seçiniz">
                                            <Option value="Kuzey Kampüs - Oda 101">Kuzey Kampüs - Oda 101</Option>
                                            <Option value="Güney Kampüs - Oda 205">Güney Kampüs - Oda 205</Option>
                                            <Option value="Hisar Kampüs - Oda A">Hisar Kampüs - Oda A</Option>
                                          </Select>
                                    }
                                </Form.Item>
                            )}
                        </Form.Item>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setCurrentStep(0)}>Geri</Button>
                                <Button type="primary" onClick={() => setCurrentStep(2)}>İleri</Button>
                            </Space>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <Alert 
                            message="Onay İşlemi" 
                            description="Onayladığınızda randevu sisteme işlenecek ve öğrenciye otomatik bilgilendirme e-postası gönderilecektir." 
                            type="warning" 
                            showIcon 
                            style={{ marginBottom: 20 }} 
                        />

                        <Descriptions bordered column={1} labelStyle={{width:'150px', fontWeight:'bold'}}>
                            <Descriptions.Item label="Öğrenci">{studentName}</Descriptions.Item>
                            <Descriptions.Item label="Terapist">{selectedTherapist?.name}</Descriptions.Item>
                            <Descriptions.Item label="Tarih & Saat">
                                {form.getFieldValue('date')?.format('DD.MM.YYYY')} - {form.getFieldValue('time')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Görüşme Türü">{form.getFieldValue('type')}</Descriptions.Item>
                            <Descriptions.Item label="Yer / Link">{form.getFieldValue('roomLink')}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setCurrentStep(1)}>Geri</Button>
                                <Button type="primary" onClick={handleFinish} loading={loading}>Randevuyu Oluştur ve Mail Gönder</Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Form>
        </Modal>
    );
};

// ============================================================================
// ANA SAYFA: BAŞVURU DETAY
// ============================================================================
const SessionDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    
    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<SessionDetailDTO | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    
    const isEditMode = location.pathname.includes('/edit/');

    useEffect(() => {
        if (id) {
            loadData(Number(id));
        }
    }, [id]);

    const loadData = async (sessionId: number) => {
        try {
            setLoading(true);
            const data = await agent.Sessions.getById(sessionId);
            setSessionData(data);
            
            const formValues: any = {};
            if (data.answers) {
                data.answers.forEach(ans => {
                    formValues[`q_${ans.questionId}`] = ans.answerValue;
                });
            }
            form.setFieldsValue(formValues);

        } catch (error) {
            message.error("Veri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        if (!sessionData) return;
        setLoading(true);
        try {
            const apiPayload = Object.keys(values).map(key => {
                const qId = parseInt(key.split('_')[1]); 
                return {
                    questionId: qId,
                    value: values[key]
                };
            });

            await agent.Sessions.update(sessionData.sessionId, apiPayload);
            message.success("Başvuru başarıyla güncellendi.");
            navigate(`/admin/session/view/${sessionData.sessionId}`);
        } catch (error) {
            message.error("Güncelleme sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><Spin size="large" tip="Yükleniyor..." /></div>;
    
    if (!sessionData) return (
        <div style={{padding:50, textAlign:'center'}}>
            <h3>Başvuru Bulunamadı</h3>
            <Button onClick={() => navigate(-1)}>Geri Dön</Button>
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{ background: '#003366', padding: '0 24px', display:'flex', alignItems:'center', color:'white' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} style={{ color: 'white', marginRight: 10 }} onClick={() => navigate(-1)} />
                <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {isEditMode ? "Başvuruyu Düzenle" : "Başvuru Detayı"} - #{sessionData.sessionId}
                </span>
            </Header>

            <Content style={{ padding: '24px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <Card style={{ marginBottom: 20, borderRadius: 8 }}>
                    <Descriptions title="Başvuru Künyesi" bordered size="small">
                        <Descriptions.Item label="Öğrenci">{sessionData.studentName}</Descriptions.Item>
                        <Descriptions.Item label="Başvuru Tarihi">{sessionData.sessionDate}</Descriptions.Item>
                        <Descriptions.Item label="Atanan Danışman">
                            {sessionData.advisorName !== "Atanmamış" ? <Tag color="blue">{sessionData.advisorName}</Tag> : <span style={{color:'#999'}}>Atama Bekliyor</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Durum">
                             {isEditMode ? <Tag color="orange">Düzenleme Modu</Tag> : <Tag color="blue">Okuma Modu</Tag>}
                        </Descriptions.Item>
                    </Descriptions>
                    
                    <div style={{marginTop: 15, textAlign:'right'}}>
                        <Space>
                            <Button 
                                type="default" 
                                style={{ borderColor: '#52c41a', color: '#52c41a' }} 
                                icon={<UserAddOutlined />}
                                onClick={() => setIsAppointmentModalOpen(true)}
                            >
                                Terapiste Yönlendir / Randevu Ver
                            </Button>

                            {!isEditMode ? (
                                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/admin/session/edit/${sessionData.sessionId}`)}>
                                    Başvuru Formunu Düzenle
                                </Button>
                            ) : (
                                <Button icon={<FileTextOutlined />} onClick={() => navigate(`/admin/session/view/${sessionData.sessionId}`)}>
                                    İptal / Görüntüle
                                </Button>
                            )}
                        </Space>
                    </div>
                </Card>

                <Card title="Başvuru Soruları" style={{ borderRadius: 8 }}>
                    <Form 
                        form={form} 
                        layout="vertical" 
                        onFinish={handleSave}
                        disabled={!isEditMode}
                    >
                        {sessionData.answers.map((q, index) => (
                            <div key={q.questionId}>
                                <Form.Item 
                                    name={`q_${q.questionId}`} 
                                    label={<span style={{fontWeight:600, color:'#333'}}>{index + 1}. {q.questionTitle}</span>}
                                    rules={[{ required: true, message: 'Bu alan zorunludur' }]}
                                >
                                    {q.questionType === 1 ? (
                                        <Input.TextArea rows={3} style={{ color: '#000' }} />
                                    ) : (
                                        <Radio.Group>
                                            <Space wrap>
                                                {q.options && q.options.length > 0 ? (
                                                    q.options.map((opt) => (
                                                        <Radio key={opt} value={opt}>{opt}</Radio>
                                                    ))
                                                ) : (
                                                    <>
                                                        <Radio value="0">0 (Hiç)</Radio>
                                                        <Radio value="1">1 (Biraz)</Radio>
                                                        <Radio value="2">2 (Oldukça)</Radio>
                                                        <Radio value="3">3 (Çok)</Radio>
                                                    </>
                                                )}
                                            </Space>
                                        </Radio.Group>
                                    )}
                                </Form.Item>
                                <Divider style={{margin:'12px 0'}} />
                            </div>
                        ))}

                        {isEditMode && (
                            <div style={{ textAlign: 'right', marginTop: 20 }}>
                                <Space>
                                    <Button onClick={() => navigate(`/admin/session/view/${sessionData.sessionId}`)}>Vazgeç</Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                                        Değişiklikleri Kaydet
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </Form>
                </Card>
                
                <AppointmentModal 
                    visible={isAppointmentModalOpen}
                    onCancel={() => setIsAppointmentModalOpen(false)}
                    sessionId={sessionData.sessionId}
                    studentName={sessionData.studentName}
                />

            </Content>
        </Layout>
    );
};

export default SessionDetailPage;