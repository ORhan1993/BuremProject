import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Select, DatePicker, Input, Radio, Table, Tag, Button, message, Descriptions, Alert, Space } from 'antd';
import { UserOutlined, CalendarOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { TherapistAvailability } from '../api/agent';
import dayjs from 'dayjs';

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

    useEffect(() => {
        if (visible) {
            if (isEditMode && existingAppointment) {
                // --- DÜZENLEME MODU: Mevcut verileri doldur ---
                const dateObj = existingAppointment.appointmentDate ? dayjs(existingAppointment.appointmentDate) : null;
                
                form.setFieldsValue({
                    date: dateObj,
                    time: dateObj ? dateObj.format('HH:mm') : null,
                    type: existingAppointment.appointmentType,
                    roomLink: existingAppointment.locationOrLink
                });

                // State'leri doldur
                setStatus(existingAppointment.status || 0);
                setCancelReason(existingAppointment.cancellationReason || "");
                setTherapistNotes(existingAppointment.therapistNotes || "");
                setRiskLevel(existingAppointment.riskLevel);
                setReferral(existingAppointment.referralDestination);
                
                // Terapist bilgisi
                setSelectedTherapist({
                    id: existingAppointment.therapistId,
                    name: existingAppointment.therapistName || "Mevcut Terapist",
                    campus: "Tanımsız", 
                    category: "Bilinmiyor",
                    currentLoad: 0,
                    dailySlots: 0,
                    workingDays: []
                });

                setCurrentStep(1);
            } else {
                // --- YENİ KAYIT MODU ---
                
                // 1. Önce form ve state'leri temizle
                setCurrentStep(0);
                form.resetFields();
                setSelectedTherapist(null);
                setTherapists([]);
                setStatus(0);
                setCancelReason("");
                setTherapistNotes("");
                setRiskLevel(undefined);
                setReferral(undefined);

                // 2. [OTOMATİK DOLDURMA] Backend'den öğrenci tercihini çek ve formu doldur
                if (sessionId) {
                    // 'any' tipi kullanarak hızlı çözüm, normalde SessionDetailDTO olmalı
                    agent.Sessions.getById(sessionId).then((data: any) => {
                        
                        // KONSOLDA KONTROL EDİN: Backend'den ne geliyor?
                        console.log("Gelen Görüşme Tercihi:", data.preferredMeetingType);

                        let autoType = undefined;
                        // Gelen veriyi güvenli hale getir (küçük harfe çevir)
                        const typeFromApi = (data.preferredMeetingType || "").toLowerCase();

                        // Eşleştirme Mantığı
                        if (typeFromApi.includes("çevrimiçi")) {
                            autoType = "Çevrimiçi";
                        } 
                        else if (typeFromApi.includes("yüzyüze")) {
                            // DİKKAT: Buradaki "Yüz Yüze" değeri, aşağıdaki Radio value ile BİREBİR AYNI olmalı (boşluklu)
                            autoType = "Yüzyüze"; 
                        }

                        // Formu güncelle
                        if (autoType) {
                            form.setFieldsValue({
                                type: autoType
                            });
                        }
                    }).catch(err => {
                        console.error("Session detayı çekilemedi:", err);
                    });
                }
            }
        }
    }, [visible, isEditMode, existingAppointment, form, sessionId]);

    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            setTherapists(data);
        } catch(e) {
            message.error("Uzman listesi alınamadı.");
        } finally {
            setLoading(false);
        }
    };

    const handleStep1Next = async () => {
        try {
            await form.validateFields(['date', 'time', 'type', 'roomLink']);
            setCurrentStep(2);
        } catch (error) {
            message.error("Lütfen tüm zorunlu alanları doldurunuz.");
        }
    };

    const handleFinish = async () => {
        try {
            setLoading(true);
            
            if (isEditMode) {
                // --- GÜNCELLEME İŞLEMİ ---
                const updateData = {
                    appointmentId: existingAppointment.id, 
                    status: status, 
                    reason: cancelReason,
                    therapistNotes: therapistNotes,
                    riskLevel: riskLevel,
                    referralDestination: referral
                };

                await agent.Appointments.updateStatus(updateData); // agent.ts'de tanımlı olmalı
                
                message.success('Randevu durumu ve notlar güncellendi.');
            } else {
                // --- YENİ KAYIT İŞLEMİ ---
                const values = form.getFieldsValue();
                const formattedDate = values.date ? dayjs(values.date).format('DD.MM.YYYY') : '';

                if (!selectedTherapist) {
                    message.error("Terapist seçimi yapılmadı.");
                    return;
                }

                await agent.Appointments.create({
                    sessionId,
                    therapistId: selectedTherapist.id,
                    date: formattedDate,
                    time: values.time,
                    type: values.type,
                    roomLink: values.roomLink
                });
                message.success('Randevu oluşturuldu ve öğrenciye e-posta gönderildi.');
            }

            onCancel(); 
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'İşlem başarısız.';
            message.error(errorMsg);
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
            title={isEditMode ? "Randevu Düzenle / Sonuçlandır" : "Terapiste Yönlendir ve Randevu Oluştur"}
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={null}
            destroyOnClose={true}
            maskClosable={false}
        >
            <Steps current={currentStep} style={{ marginBottom: 20 }}>
                <Step title="Uzman" icon={<UserOutlined />} disabled={isEditMode} />
                <Step title="Zaman & Yer" icon={<CalendarOutlined />} />
                <Step title={isEditMode ? "Sonuçlandır" : "Onay"} icon={isEditMode ? <EditOutlined /> : <CheckCircleOutlined />} />
            </Steps>

            <Form form={form} layout="vertical" preserve={true}>
                {/* ADIM 0: UZMAN SEÇİMİ */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    {!isEditMode && (
                        <>
                            <Form.Item label="Uzman Kategorisi">
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
                                scroll={{ y: 300 }}
                            />
                        </>
                    )}
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Button type="primary" disabled={!selectedTherapist} onClick={() => setCurrentStep(1)}>İleri</Button>
                    </div>
                </div>

                {/* ADIM 1: TARİH VE YER */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <Descriptions title="Seçilen Uzman" size="small" bordered style={{marginBottom: 20}} contentStyle={{ fontWeight: 'bold' }}>
                        <Descriptions.Item label="Ad Soyad">{selectedTherapist?.name}</Descriptions.Item>
                        <Descriptions.Item label="Kampüs">{selectedTherapist?.campus}</Descriptions.Item>
                    </Descriptions>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="date" label="Tarih" rules={[{ required: true, message: 'Tarih seçiniz' }]} style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" disabled={isEditMode} /> 
                        </Form.Item>
                        <Form.Item name="time" label="Saat" rules={[{ required: true, message: 'Saat seçiniz' }]} style={{ flex: 1 }}>
                            <Select placeholder="Saat Seçiniz" disabled={isEditMode}>
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
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
                            <h4 className="font-bold text-gray-700 mb-2">Randevu Sonuçlandırma</h4>
                            <Form.Item label="Durum">
                                <Select value={status} onChange={(val) => setStatus(val)} className="w-full">
                                    <Option value={AppointmentStatus.Planned}>Planlandı (Bekliyor)</Option>
                                    <Option value={AppointmentStatus.Completed}>✅ Tamamlandı (Geldi)</Option>
                                    <Option value={AppointmentStatus.NoShow}>❌ Gelmedi (No-Show)</Option>
                                    <Option value={AppointmentStatus.Cancelled}>🚫 İptal Edildi</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    )}

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            {!isEditMode && <Button onClick={() => setCurrentStep(0)}>Geri</Button>}
                            <Button type="primary" onClick={handleStep1Next}>İleri</Button>
                        </Space>
                    </div>
                </div>

                {/* ADIM 2: ONAY ve SONUÇLANDIRMA */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    {!isEditMode && (
                        <Alert message="Dikkat: Onayladığınızda öğrenciye mail gönderilecektir." type="warning" showIcon style={{ marginBottom: 20 }} />
                    )}

                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Öğrenci">{studentName}</Descriptions.Item>
                        <Descriptions.Item label="Terapist">{selectedTherapist?.name}</Descriptions.Item>
                        <Descriptions.Item label="Tarih & Saat">
                            {form.getFieldValue('date')?.format('DD.MM.YYYY')} - {form.getFieldValue('time')}
                        </Descriptions.Item>
                    </Descriptions>

                    {/* DÜZENLEME MODU DETAYLARI */}
                    {isEditMode && (
                        <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                            <h4 style={{marginBottom: 10, fontWeight: 'bold'}}>Görüşme Detayları</h4>
                            
                            <div style={{marginBottom: 15}}>
                                <span style={{display:'block', marginBottom: 5, fontWeight:600}}>Randevu Durumu:</span>
                                <Select value={status} onChange={setStatus} style={{ width: '100%' }}>
                                    <Option value={AppointmentStatus.Planned}>Planlandı</Option>
                                    <Option value={AppointmentStatus.Completed}>Tamamlandı (Geldi)</Option>
                                    <Option value={AppointmentStatus.NoShow}>Gelmedi (No-Show)</Option>
                                    <Option value={AppointmentStatus.Cancelled}>İptal Edildi</Option>
                                </Select>
                            </div>

                            {(status === AppointmentStatus.NoShow || status === AppointmentStatus.Cancelled) && (
                                <div>
                                    <span style={{display:'block', marginBottom: 5}}>Neden:</span>
                                    <TextArea 
                                        rows={2} 
                                        value={cancelReason} 
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="İptal veya gelmeme nedenini giriniz..."
                                    />
                                </div>
                            )}

                            {status === AppointmentStatus.Completed && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginTop: 10 }}>
                                    <Alert message="Aşağıdaki alanlar sadece terapistler tarafından görüntülenebilir (Gizli)." type="info" showIcon style={{ marginBottom: 15 }} />
                                    
                                    <Form.Item label="Görüşme Özeti / Terapist Notları">
                                        <TextArea 
                                            rows={4} 
                                            value={therapistNotes}
                                            onChange={(e) => setTherapistNotes(e.target.value)}
                                            placeholder="Görüşme özeti, planlanan adımlar, kritik notlar..."
                                        />
                                    </Form.Item>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Form.Item label="Risk Seviyesi" style={{ flex: 1 }}>
                                            <Select value={riskLevel} onChange={setRiskLevel} placeholder="Risk Durumu">
                                                <Option value="Yok">Risk Yok</Option>
                                                <Option value="Düşük">Düşük Risk</Option>
                                                <Option value="Orta">Orta Risk</Option>
                                                <Option value="Yüksek">Yüksek Risk</Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item label="Yönlendirme (Gerekirse)" style={{ flex: 1 }}>
                                            <Select value={referral} onChange={setReferral} placeholder="Kurum Seçiniz">
                                                <Option value="">Yok</Option>
                                                <Option value="BÜPAM">BÜPAM</Option>
                                                <Option value="Hastane">Hastane / Psikiyatri</Option>
                                                <Option value="Revir">Revir</Option>
                                                <Option value="Özel">Özel Merkez</Option>
                                            </Select>
                                        </Form.Item>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCurrentStep(1)}>Geri</Button>
                            <Button type="primary" onClick={handleFinish} loading={loading}>
                                {isEditMode ? "Kaydet ve Kapat" : "Randevuyu Oluştur"}
                            </Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default AppointmentModal;