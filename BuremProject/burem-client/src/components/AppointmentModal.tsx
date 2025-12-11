import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Select, DatePicker, Input, Radio, Table, Tag, Button, message, Descriptions, Alert, Space } from 'antd';
import { UserOutlined, CalendarOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { TherapistAvailability } from '../api/agent';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Dayjs'in özel formatları (dd.MM.yyyy) okuyabilmesi için eklenti
dayjs.extend(customParseFormat);

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

enum AppointmentStatus {
    Planned = 0,
    Completed = 1,
    NoShow = 2,
    Cancelled = 3
}

interface Props {
    visible: boolean;
    onCancel: () => void;
    sessionId: number;
    studentName: string;
    studentCampus?: string;
    existingAppointment?: any; 
}

const AppointmentModal = ({ visible, onCancel, sessionId, studentName, studentCampus, existingAppointment }: Props) => {
    // State Tanımları
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistAvailability | null>(null);
    
    // Durum ve Raporlama State'leri
    const [status, setStatus] = useState<number>(0);
    const [cancelReason, setCancelReason] = useState("");
    const [therapistNotes, setTherapistNotes] = useState("");
    const [riskLevel, setRiskLevel] = useState<string | undefined>(undefined);
    const [referral, setReferral] = useState<string | undefined>(undefined);

    const [form] = Form.useForm();
    const isEditMode = !!existingAppointment;

    // Modal açıldığında state'leri yönet
    useEffect(() => {
        if (visible) {
            if (isEditMode && existingAppointment) {
                // --- DÜZENLEME MODU ---
                // Backend'den 'dd.MM.yyyy' string geliyor, onu dayjs objesine çeviriyoruz
                const dateObj = existingAppointment.date 
                    ? dayjs(existingAppointment.date, 'DD.MM.YYYY') 
                    : null;
                
                form.setFieldsValue({
                    date: dateObj,
                    time: existingAppointment.time,
                    type: existingAppointment.type,
                    roomLink: existingAppointment.locationOrLink
                });

                // Status enum veya string gelebilir, garantiye alalım
                setStatus(Number(existingAppointment.status) || 0); 
                setCancelReason(existingAppointment.cancellationReason || "");
                setTherapistNotes(existingAppointment.note || ""); // Backend DTO'da 'Note' olarak geliyor
                setRiskLevel(existingAppointment.riskLevel);
                setReferral(existingAppointment.referralDestination);
                
                // Görsel amaçlı seçili terapisti set et
                setSelectedTherapist({
                    id: existingAppointment.therapistId || 0,
                    name: existingAppointment.therapistName || "Mevcut Terapist",
                    campus: "Tanımsız", 
                    category: "Bilinmiyor",
                    currentLoad: 0,
                    dailySlots: 0,
                    workingDays: []
                });

                setCurrentStep(1); // Direkt detay ekranına git
            } else {
                // --- YENİ KAYIT MODU ---
                resetFormState();
                
                // Başvuru tercihine göre form doldur (Otomatik)
                if (sessionId) {
                    agent.Sessions.getById(sessionId).then((data: any) => {
                        const typeFromApi = (data.preferredMeetingType || "").toLowerCase();
                        if (typeFromApi.includes("çevrimiçi")) form.setFieldsValue({ type: "Çevrimiçi" });
                        else if (typeFromApi.includes("yüzyüze")) form.setFieldsValue({ type: "Yüzyüze" });
                    }).catch(err => console.error("Session detayı çekilemedi:", err));
                }
            }
        }
    }, [visible, isEditMode, existingAppointment, sessionId, form]);

    const resetFormState = () => {
        setCurrentStep(0);
        form.resetFields();
        setSelectedTherapist(null);
        setTherapists([]);
        setStatus(0);
        setCancelReason("");
        setTherapistNotes("");
        setRiskLevel(undefined);
        setReferral(undefined);
    };

    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            setTherapists(data || []);
        } catch(e) {
            message.error("Uzman listesi alınamadı.");
        } finally {
            setLoading(false);
        }
    };

    const handleStep1Next = () => {
        if (!selectedTherapist && !isEditMode) {
            message.error("Lütfen bir terapist seçiniz.");
            return;
        }
        setCurrentStep(1);
    };

    const handleStep2Next = async () => {
        try {
            await form.validateFields(['date', 'time', 'type', 'roomLink']);
            setCurrentStep(2);
        } catch (error) {
            message.error("Lütfen zorunlu alanları doldurunuz.");
        }
    };

    const handleFinish = async () => {
        try {
            setLoading(true);
            
            if (isEditMode) {
                // --- GÜNCELLEME ---
                const updateData = {
                    appointmentId: existingAppointment.id, 
                    status: status, 
                    reason: cancelReason,
                    therapistNotes: therapistNotes,
                    riskLevel: riskLevel,
                    referralDestination: referral
                };

                // agent.ts dosyanızda bu metodun olduğundan emin olun (Reports veya Appointments altında)
                await agent.Reports.updateAppointmentStatus(updateData.appointmentId, updateData.status, updateData.reason); 
                
                message.success('Randevu güncellendi.');
            } else {
                // --- YENİ KAYIT ---
                const values = form.getFieldsValue();
                
                if (!selectedTherapist) {
                    message.error("Terapist seçimi kayboldu.");
                    return;
                }

                await agent.Appointments.create({
                    sessionId: sessionId,
                    therapistId: selectedTherapist.id,
                    // Backend CreateAppointmentDto 'yyyy-MM-dd' bekliyorsa:
                    appointmentDate: values.date ? values.date.format('YYYY-MM-DD') : '', 
                    appointmentHour: values.time,
                    appointmentType: values.type,
                    locationOrLink: values.roomLink
                });
                message.success('Randevu oluşturuldu.');
            }

            onCancel(); 
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'İşlem başarısız.';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Uzman', dataIndex: 'name', key: 'name' },
        { title: 'Kampüs', dataIndex: 'campus', key: 'campus', render: (text: string) => (
            <Tag color={text === studentCampus ? 'green' : 'blue'}>{text}</Tag>
        )},
        { title: 'Yük', dataIndex: 'currentLoad', key: 'load' },
        { title: 'Slot', dataIndex: 'dailySlots', key: 'slots' },
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
            title={isEditMode ? "Randevu Düzenle" : "Yeni Randevu Oluştur"}
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={null}
            destroyOnClose={true} // Modal kapanınca içeriği sıfırla
            maskClosable={false}
        >
            <Steps current={currentStep} style={{ marginBottom: 20 }}>
                <Step title="Uzman" icon={<UserOutlined />} disabled={isEditMode} />
                <Step title="Zaman & Yer" icon={<CalendarOutlined />} />
                <Step title="Onay" icon={<CheckCircleOutlined />} />
            </Steps>

            <Form form={form} layout="vertical" preserve={false}>
                
                {/* ADIM 0: UZMAN SEÇİMİ */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    {!isEditMode && (
                        <>
                            <Form.Item label="Uzman Kategorisi">
                                <Select placeholder="Kategori Seçin" onChange={handleCategoryChange}>
                                    <Option value="Tümü">Tümü</Option>
                                    <Option value="Deneyimli Uzman">Deneyimli Uzman</Option>
                                    <Option value="Gönüllü Uzman">Gönüllü Uzman</Option>
                                    <Option value="BÜREM Uzmanı">BÜREM Uzmanı</Option>
                                </Select>
                            </Form.Item>

                            <Table 
                                dataSource={therapists} 
                                columns={columns} 
                                rowKey="id" 
                                pagination={false} 
                                size="small"
                                loading={loading}
                                locale={{emptyText: 'Lütfen bir kategori seçiniz.'}}
                                scroll={{ y: 250 }}
                            />
                        </>
                    )}
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        {!isEditMode && <Button type="primary" disabled={!selectedTherapist} onClick={handleStep1Next}>İleri</Button>}
                    </div>
                </div>

                {/* ADIM 1: TARİH VE YER */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <Descriptions title="Seçilen Uzman" size="small" bordered style={{marginBottom: 20}}>
                        <Descriptions.Item label="Ad Soyad">{selectedTherapist?.name}</Descriptions.Item>
                        <Descriptions.Item label="Kampüs">{selectedTherapist?.campus}</Descriptions.Item>
                    </Descriptions>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="date" label="Tarih" rules={[{ required: true, message: 'Tarih seçiniz' }]} style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" disabled={isEditMode} /> 
                        </Form.Item>
                        <Form.Item name="time" label="Saat" rules={[{ required: true, message: 'Saat seçiniz' }]} style={{ flex: 1 }}>
                            <Select placeholder="Saat Seçiniz" disabled={isEditMode}>
                                {/* Bu saatleri dinamik yapmak isterseniz GetAvailableHours endpointini çağırabilirsiniz */}
                                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="type" label="Görüşme Türü" rules={[{ required: true, message: 'Tür seçiniz' }]}>
                        <Radio.Group disabled={isEditMode}>
                            <Radio value="Yüzyüze">Yüzyüze</Radio>
                            <Radio value="Çevrimiçi">Çevrimiçi</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                        {({ getFieldValue }) => (
                            <Form.Item 
                                name="roomLink" 
                                label={getFieldValue('type') === 'Çevrimiçi' ? "Zoom/Meet Linki" : "Görüşme Odası"} 
                                rules={[{ required: true, message: 'Bu alan zorunludur' }]}
                            >
                                {getFieldValue('type') === 'Çevrimiçi' 
                                    ? <Input placeholder="https://zoom.us/..." />
                                    : <Select placeholder="Oda Seçiniz">
                                        <Option value="Kuzey Oda 1">Kuzey Oda 1</Option>
                                        <Option value="Güney Oda 3">Güney Oda 3</Option>
                                      </Select>
                                }
                            </Form.Item>
                        )}
                    </Form.Item>

                    {isEditMode && (
                        <div className="p-4 bg-gray-50 border rounded mb-4" style={{padding: 15, background: '#f5f5f5', borderRadius: 6}}>
                            <Form.Item label="Durum">
                                <Select value={status} onChange={setStatus}>
                                    <Option value={AppointmentStatus.Planned}>Planlandı</Option>
                                    <Option value={AppointmentStatus.Completed}>Tamamlandı</Option>
                                    <Option value={AppointmentStatus.NoShow}>Gelmedi</Option>
                                    <Option value={AppointmentStatus.Cancelled}>İptal</Option>
                                </Select>
                            </Form.Item>
                            
                            {(status === AppointmentStatus.Cancelled || status === AppointmentStatus.NoShow) && (
                                <Form.Item label="Neden">
                                    <TextArea rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                                </Form.Item>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            {!isEditMode && <Button onClick={() => setCurrentStep(0)}>Geri</Button>}
                            <Button type="primary" onClick={handleStep2Next}>İleri</Button>
                        </Space>
                    </div>
                </div>

                {/* ADIM 2: ONAY */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <Alert message="İşlem onaylandığında ilgili kişilere e-posta gönderilecektir." type="info" showIcon style={{ marginBottom: 20 }} />
                    
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Öğrenci">{studentName}</Descriptions.Item>
                        <Descriptions.Item label="Terapist">{selectedTherapist?.name}</Descriptions.Item>
                        <Descriptions.Item label="Tarih">
                            {form.getFieldValue('date')?.format('DD.MM.YYYY')} - {form.getFieldValue('time')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Yer/Link">{form.getFieldValue('roomLink')}</Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCurrentStep(1)}>Geri</Button>
                            <Button type="primary" onClick={handleFinish} loading={loading}>
                                {isEditMode ? "Güncelle ve Bitir" : "Randevuyu Oluştur"}
                            </Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default AppointmentModal;