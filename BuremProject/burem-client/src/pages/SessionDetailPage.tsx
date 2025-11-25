import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Card, Form, Input, Radio, Button, Spin, message, Descriptions, Tag, Space, Divider, Modal, Steps, Select, DatePicker, Alert, Row, Col, Typography, Table } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, EditOutlined, UserAddOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { SessionDetailDTO, TherapistAvailability } from '../api/agent';

const { Header, Content } = Layout;
const { Step } = Steps;
const { Option } = Select;

// ============================================================================
// 1. STİLLER (Görsel Tasarım İçin)
// ============================================================================
const styles = {
    // Üst Kısım: Gri Label - Beyaz Değer Kutusu
    infoRow: {
        display: 'flex',
        marginBottom: '10px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    labelBox: {
        backgroundColor: '#f5f5f5', // REFERANS GÖRSELDEKİ GRİ RENK
        padding: '8px 12px',
        width: '180px', // Sol tarafın sabit genişliği
        borderRight: '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
        color: '#555',
        fontSize: '13px'
    },
    valueBox: {
        padding: '8px 12px',
        flex: 1,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        minHeight: '40px',
        fontSize: '14px',
        color: '#333'
    },
    // Alt Kısım: Soru Kartı
    questionCard: {
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        marginBottom: '15px',
        overflow: 'hidden',
        minHeight: '60px'
    },
    questionText: {
        flex: 1,
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        fontStyle: 'italic',
        color: '#444',
        fontSize: '14px',
        fontWeight: 500,
        backgroundColor: '#fff'
    },
    answerContainer: {
        width: 'auto',
        minWidth: '300px',
        borderLeft: '1px solid #d9d9d9', // DİKEY AYIRICI ÇİZGİ
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#fff'
    }
};

// ============================================================================
// 2. RANDEVU MODALI BİLEŞENİ
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
// 3. ANA SAYFA BİLEŞENİ
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
                if (!key.startsWith('q_')) return null;
                const qId = parseInt(key.split('_')[1]); 
                return {
                    questionId: qId,
                    value: values[key]
                };
            }).filter(x => x !== null);

            await agent.Sessions.update(sessionData.sessionId, apiPayload);
            message.success("Başvuru güncellendi.");
            navigate(`/admin/session/view/${sessionData.sessionId}`);
        } catch (error) {
            message.error("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Helper Component: Gri/Beyaz Satır (Sayfa içinde kullanım için)
    const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <div style={styles.infoRow}>
            <div style={styles.labelBox}>{label}</div>
            <div style={styles.valueBox}>{value}</div>
        </div>
    );

    if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><Spin size="large" /></div>;
    
    if (!sessionData) return <div>Başvuru Bulunamadı</div>;

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Header Mavi Şerit */}
            <Header style={{ background: '#003366', padding: '0 24px', display:'flex', alignItems:'center', justifyContent: 'space-between', height: '64px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} style={{ color: 'white', marginRight: 10, fontSize: '16px' }} onClick={() => navigate(-1)} />
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                        Başvuru Detayı - #{sessionData.sessionId}
                    </span>
                </div>
                <div style={{ color: 'white', opacity: 0.8 }}>
                    {isEditMode ? "Düzenleme Modu" : "Görüntüleme Modu"}
                </div>
            </Header>

            <Content style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
                
                {/* 1. KISIM: KÜNYE BİLGİLERİ (Görsel 1'deki Gri/Beyaz Grid) */}
                <Card bordered={false} style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{marginBottom: 20, color: '#003366'}}>Başvuru Künyesi</h3>
                    <Row gutter={24}>
                        <Col span={12}>
                            <InfoRow label="Öğrenci" value={sessionData.studentName} />
                            <InfoRow label="Öğrenci No" value="1000100100" />
                            <InfoRow label="Başvuru Tarihi" value={sessionData.sessionDate} />
                            <InfoRow label="Yerleşke" value={
                                <Select 
                                    defaultValue="Sarıtepe Yerleşkesi" 
                                    bordered={false} 
                                    style={{ width: '100%', marginLeft: -10 }} 
                                    disabled={!isEditMode}
                                >
                                    <Option value="Kuzey">Kuzey Kampüs</Option>
                                    <Option value="Sarıtepe Yerleşkesi">Sarıtepe Yerleşkesi</Option>
                                </Select>
                            } />
                        </Col>
                        <Col span={12}>
                             <InfoRow label="Ön Görüşme Yapan" value="Başak Yılmaz" />
                             <InfoRow label="Atanan Danışman" value={sessionData.advisorName !== "Atanmamış" ? <Tag color="blue">{sessionData.advisorName}</Tag> : <Tag>Bilinmiyor</Tag>} />
                             <InfoRow label="Durum" value={isEditMode ? <Tag color="processing">Düzenleniyor</Tag> : <Tag color="success">Okuma Modu</Tag>} />
                        </Col>
                    </Row>

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                         <Space>
                            <Button 
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

                {/* 2. KISIM: SORULAR VE CEVAPLAR */}
                <Form form={form} onFinish={handleSave} disabled={!isEditMode}>
                    {sessionData.answers.map((q) => {
                        const hasOptions = q.options && q.options.length > 0;
                        
                        // Radyo Butonu (Likert) Tespiti
                        const currentAnswer = form.getFieldValue(`q_${q.questionId}`);
                        const isNumericAnswer = ["0","1","2","3"].includes(String(currentAnswer));
                        
                        const isLikert = (hasOptions && q.options.some(opt => ["0", "1", "2", "3"].includes(opt.label.trim()))) || (!hasOptions && isNumericAnswer);

                        // Fallback Seçenekleri
                        const displayOptions = (isLikert && !hasOptions) 
                            ? [
                                { label: "0", value: "0" }, 
                                { label: "1", value: "1" }, 
                                { label: "2", value: "2" }, 
                                { label: "3", value: "3" },
                                { label: "Cevap Yok", value: "Cevap Yok" }
                              ] 
                            : q.options;

                        const isDropdown = hasOptions && !isLikert;
                        const isText = !isLikert && !isDropdown;

                        return (
                            <div key={q.questionId} style={styles.questionCard}>
                                {/* SOL: Soru Metni */}
                                <div style={styles.questionText}>
                                    {q.questionTitle}
                                </div>

                                {/* SAĞ: Cevap Alanı */}
                                <div style={styles.answerContainer}>
                                    <Form.Item name={`q_${q.questionId}`} style={{ marginBottom: 0, width: '100%' }}>
                                        
                                        {isLikert && (
                                            <Radio.Group>
                                                <Space>
                                                    {displayOptions.map((opt: any) => (
                                                        <Radio key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </Radio>
                                                    ))}
                                                </Space>
                                            </Radio.Group>
                                        )}

                                        {isDropdown && (
                                            <Select style={{ width: '100%' }} placeholder="Seçiniz">
                                                {q.options.map(opt => (
                                                    <Option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </Option>
                                                ))}
                                            </Select>
                                        )}

                                        {isText && (
                                            <Input.TextArea 
                                                rows={1} 
                                                style={{ width: '100%', resize: 'none' }} 
                                                autoSize={{ minRows: 1, maxRows: 4 }}
                                                placeholder="Cevap giriniz..."
                                            />
                                        )}
                                        
                                    </Form.Item>
                                </div>
                            </div>
                        );
                    })}

                    {isEditMode && (
                        <div style={{ textAlign: 'right', marginTop: 20, marginBottom: 50 }}>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                                Değişiklikleri Kaydet
                            </Button>
                        </div>
                    )}
                </Form>
                
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