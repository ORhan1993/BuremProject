import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Card, Form, Input, Radio, Button, Spin, message, Tag, Space, Select, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, EditOutlined, UserAddOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { SessionDetailDTO } from '../api/agent';
// Harici olarak oluşturduğumuz ve düzelttiğimiz Modalı çağırıyoruz
import AppointmentModal from '../components/AppointmentModal'; 

const { Header, Content } = Layout;
const { Option } = Select;

// --- GÖRSEL STİLLER ---
const styles = {
    infoRow: {
        display: 'flex',
        marginBottom: '10px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    labelBox: {
        backgroundColor: '#f5f5f5',
        padding: '8px 12px',
        width: '180px',
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
        borderLeft: '1px solid #d9d9d9',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#fff'
    }
};

// --- YARDIMCI BİLEŞEN (InfoRow) ---
// Performans için ana bileşenin dışına alındı
const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div style={styles.infoRow}>
        <div style={styles.labelBox}>{label}</div>
        <div style={styles.valueBox}>{value}</div>
    </div>
);

// --- ANA SAYFA BİLEŞENİ ---
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

    if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><Spin size="large" /></div>;
    
    if (!sessionData) return <div>Başvuru Bulunamadı</div>;

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
                
                {/* 1. KISIM: KÜNYE BİLGİLERİ */}
                <Card 
                    variant="borderless" // Deprecated 'bordered' yerine
                    style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    styles={{ body: {padding: '24px'} }} // Deprecated 'bodyStyle' yerine
                >
                    <h3 style={{marginBottom: 20, color: '#003366'}}>Başvuru Künyesi</h3>
                    <Row gutter={24}>
                        <Col span={12}>
                            <InfoRow label="Öğrenci" value={sessionData.studentName} />
                            <InfoRow label="Öğrenci No" value={sessionData.studentNumber || "1000100100"} />
                            <InfoRow label="Başvuru Tarihi" value={sessionData.sessionDate} />
                            <InfoRow label="Yerleşke" value={
                                <Select 
                                    defaultValue="Sarıtepe Yerleşkesi" 
                                    variant="borderless" // Deprecated 'bordered' yerine
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
                
                {/* Harici Modal Bileşeni Çağrılıyor */}
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