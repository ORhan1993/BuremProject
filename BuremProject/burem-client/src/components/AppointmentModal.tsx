import { useState, useEffect } from 'react';
import { 
    Modal, 
    Steps, 
    Form, 
    Select, 
    DatePicker, 
    Input, 
    Radio, 
    Table, 
    Tag, 
    Button, 
    message, 
    Descriptions, 
    Alert, 
    Space, 
    Divider, 
    Card, 
    Badge 
} from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined, 
    CheckCircleOutlined, 
    EditOutlined, 
    SolutionOutlined, 
    GlobalOutlined 
} from '@ant-design/icons';
import agent from '../api/agent';
import type { TherapistAvailability } from '../api/agent';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Tarih formatlama eklentisi (Backend formatı için şart)
dayjs.extend(customParseFormat);

// --- SABİT TANIMLAR VE ENUMLAR ---
const PRIMARY_COLOR = '#1e4a8b';
const SECONDARY_COLOR = '#8cc8ea';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

enum AppointmentStatus {
    Planned = 0,
    Completed = 1,
    NoShow = 2,
    Cancelled = 3
}

// Modalın alacağı parametreler (Props)
interface Props {
    visible: boolean;
    onCancel: () => void;
    sessionId: number;
    studentName: string;
    studentCampus?: string;
    existingAppointment?: any; // Eğer doluysa "Düzenleme Modu", boşsa "Yeni Randevu Modu"
    roleId?: number; // 2: Sekreter, 4: Terapist
}

const AppointmentModal = ({ visible, onCancel, sessionId, studentName, studentCampus, existingAppointment, roleId = 2 }: Props) => {
    // --- STATE TANIMLARI ---
    
    // Adım Kontrolü (0: Uzman, 1: Zaman, 2: Onay)
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Terapist Listesi ve Seçimi
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistAvailability | null>(null);
    
    // Düzenleme / Sonuçlandırma için Form State'leri
    const [status, setStatus] = useState<number>(0);
    const [cancelReason, setCancelReason] = useState("");
    const [therapistNotes, setTherapistNotes] = useState("");
    const [riskLevel, setRiskLevel] = useState<string | undefined>(undefined);
    const [referral, setReferral] = useState<string | undefined>(undefined);

    // Ant Design Form Instance
    const [form] = Form.useForm();
    
    // Mod Kontrolü: existingAppointment varsa "Düzenleme Modu" aktif olur
    const isEditMode = !!existingAppointment;

    // --- MODAL AÇILIŞ MANTIĞI (USEEFFECT) ---
    useEffect(() => {
        // Modal kapalıysa işlem yapma (useForm uyarısını engeller)
        if (!visible) return;

        // Form elemanlarının DOM'a yerleşmesi için minik bir gecikme (Warning Fix)
        const timer = setTimeout(() => {
            
            if (isEditMode && existingAppointment) {
                // ----------------------------------------------------
                // MOD: DÜZENLEME (TERAPİST / SEKRETER GÜNCELLEME)
                // ----------------------------------------------------
                console.log("MOD: Düzenleme Modu Açıldı", existingAppointment);
                
                // Backend'den gelen tarih (dd.MM.yyyy) stringini dayjs objesine çevir
                // Eğer format farklıysa (YYYY-MM-DD) onu da dene
                let dateObj = null;
                if (existingAppointment.date) {
                    dateObj = dayjs(existingAppointment.date, 'DD.MM.YYYY');
                    if (!dateObj.isValid()) {
                        dateObj = dayjs(existingAppointment.date, 'YYYY-MM-DD');
                    }
                }
                
                // Form alanlarını doldur
                form.setFieldsValue({
                    date: dateObj,
                    time: existingAppointment.time, // "14:00"
                    type: existingAppointment.type, // "Yüzyüze"
                    roomLink: existingAppointment.locationOrLink
                });

                // State'leri doldur
                setStatus(Number(existingAppointment.status) || 0); 
                setCancelReason(existingAppointment.cancellationReason || "");
                setTherapistNotes(existingAppointment.note || ""); // DTO'da Note olarak gelebilir
                setRiskLevel(existingAppointment.riskLevel);
                setReferral(existingAppointment.referralDestination);
                
                // Sanal terapist objesi oluştur (Görsel ve ID için gerekli)
                setSelectedTherapist({
                    id: existingAppointment.therapistId || 0,
                    name: existingAppointment.therapistName || "Mevcut Terapist",
                    campus: "Tanımsız", 
                    category: "Bilinmiyor",
                    currentLoad: 0,
                    dailySlots: 0,
                    workingDays: []
                });

                // Düzenleme modunda Uzman Seçimi adımını atla, direkt Detay sayfasına git
                setCurrentStep(1); 

            } else {
                // ----------------------------------------------------
                // MOD: YENİ RANDEVU (SEKRETER)
                // ----------------------------------------------------
                console.log("MOD: Yeni Randevu Modu Açıldı");
                resetFormState();
                
                // Otomatik olarak "Tümü" kategorisini getir ve listeyi doldur
                handleCategoryChange("Tümü");
                form.setFieldsValue({ categorySelect: "Tümü" }); 
                
                // Öğrencinin başvuru formundaki tercihine göre (Online/Yüz yüze) formu önceden doldur
                if (sessionId && sessionId > 0) {
                    agent.Sessions.getById(sessionId).then((data: any) => {
                        if (data && data.preferredMeetingType) {
                            const typeFromApi = data.preferredMeetingType.toLowerCase();
                            if (typeFromApi.includes("çevrimiçi")) {
                                form.setFieldsValue({ type: "Çevrimiçi" });
                            } else if (typeFromApi.includes("yüzyüze")) {
                                form.setFieldsValue({ type: "Yüzyüze" });
                            }
                        }
                    }).catch(err => console.error("Session detayı çekilemedi:", err));
                }
            }
        }, 100); // 100ms gecikme render için yeterlidir

        return () => clearTimeout(timer); // Cleanup
    }, [visible, isEditMode, existingAppointment, sessionId, form]);

    // Formu ve State'leri Sıfırlama
    const resetFormState = () => {
        setCurrentStep(0); // Başa dön (Uzman Seçimi)
        form.resetFields();
        setSelectedTherapist(null);
        setTherapists([]);
        setStatus(0);
        setCancelReason("");
        setTherapistNotes("");
        setRiskLevel(undefined);
        setReferral(undefined);
    };

    // --- API İŞLEMLERİ ---
    
    // Terapist Listesini Çekme
    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            // Gelen verinin dizi olduğundan emin olalım
            setTherapists(Array.isArray(data) ? data : []);
        } catch(e) {
            console.error(e);
            message.error("Uzman listesi alınamadı.");
            setTherapists([]);
        } finally {
            setLoading(false);
        }
    };

    // --- ADIM GEÇİŞLERİ (WIZARD LOGIC) ---

    // Adım 0 -> Adım 1
    const handleStep1Next = () => {
        if (!selectedTherapist && !isEditMode) {
            message.error("Lütfen listeden bir terapist seçiniz.");
            return;
        }
        setCurrentStep(1);
    };

    // Adım 1 -> Adım 2 (Validasyonlu)
    const handleStep2Next = async () => {
        try {
            // Zorunlu alanları kontrol et
            await form.validateFields(['date', 'time', 'type', 'roomLink']);
            setCurrentStep(2); // Onay ekranına geç
        } catch (error) {
            message.error("Lütfen zorunlu alanları doldurunuz.");
        }
    };

    // --- KAYIT / GÜNCELLEME İŞLEMİ (NİHAİ SONUÇ) ---
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
                
                // Backend'e güncelleme isteği at
                await agent.Reports.updateAppointmentStatus(updateData.appointmentId, updateData.status, updateData.reason); 
                // Not: updateAppointmentStatus fonksiyonunuz sadece status/reason alıyorsa diğer veriler için backend'i güncellemeniz gerekebilir.
                
                message.success('Randevu durumu güncellendi.');
            } else {
                // --- YENİ KAYIT İŞLEMİ ---
                const values = form.getFieldsValue();
                
                if (!selectedTherapist) {
                    message.error("Terapist seçimi kayboldu. Lütfen tekrar seçiniz.");
                    setLoading(false);
                    return;
                }

                // 400 HATASI ÇÖZÜMÜ İÇİN GÜVENLİ VERİ OLUŞTURMA (Payload)
                const payload = {
                    sessionId: Number(sessionId), // ID'yi sayıya çevir
                    therapistId: Number(selectedTherapist.id),
                    // Tarihi YYYY-MM-DD formatında string olarak gönderiyoruz
                    appointmentDate: values.date ? values.date.format('YYYY-MM-DD') : '', 
                    appointmentHour: values.time,
                    appointmentType: values.type,
                    locationOrLink: values.roomLink,
                    currentUserRoleId: Number(roleId || 2) // Varsayılan 2 (Sekreter)
                };

                // Konsola basıp kontrol edelim
                console.log("📤 API'ye Gönderilen Payload:", payload);

                // Son Kontrol
                if (!payload.sessionId || payload.sessionId === 0) {
                    message.error("HATA: Başvuru ID (SessionID) geçersiz veya 0. Lütfen sayfayı yenileyiniz.");
                    setLoading(false);
                    return;
                }

                // Backend isteği
                await agent.Appointments.create(payload);
                message.success('Randevu başarıyla oluşturuldu.');
            }

            // Başarılı olursa modalı kapat
            onCancel(); 
        } catch (error: any) {
            console.error("API HATASI DETAYI:", error);
            const msg = error.response?.data?.message || error.response?.data || 'İşlem başarısız.';
            // Mesaj obje ise stringe çevir (object Object hatasını önlemek için)
            const displayMsg = typeof msg === 'object' ? JSON.stringify(msg) : msg;
            message.error(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    // Tablo Sütun Tanımları
    const columns = [
        { 
            title: 'Uzman', 
            dataIndex: 'name', 
            key: 'name' 
        },
        { 
            title: 'Kampüs', 
            dataIndex: 'campus', 
            key: 'campus', 
            render: (text: string) => (
                <Tag color={text === studentCampus ? 'green' : 'blue'}>{text || 'Genel'}</Tag>
            )
        },
        { 
            title: 'Yük', 
            dataIndex: 'currentLoad', 
            key: 'currentLoad' 
        },
        { 
            title: 'Müsaitlik', 
            dataIndex: 'dailySlots', 
            key: 'dailySlots', 
            render: (val: number) => (
                val > 0 
                ? <Badge status="success" text={`${val} Slot`} /> 
                : <Badge status="error" text="Dolu" />
            )
        },
        { 
            title: 'Seç',
            key: 'action',
            render: (_: any, record: TherapistAvailability) => (
                <Button 
                    size="small" 
                    type={selectedTherapist?.id === record.id ? 'primary' : 'default'} 
                    disabled={record.dailySlots <= 0} // Doluysa buton pasif
                    onClick={() => setSelectedTherapist(record)}
                >
                    {selectedTherapist?.id === record.id ? 'Seçildi' : 'Seç'}
                </Button>
            )
        }
    ];

    // --- RENDER ---
    return (
        <Modal
            title={
                <Space>
                    {isEditMode ? <EditOutlined /> : <CalendarOutlined />}
                    <span style={{ fontSize: 18 }}>
                        {isEditMode ? "Randevu Yönetimi / Sonuçlandırma" : "Yeni Randevu Oluştur"}
                    </span>
                </Space>
            }
            open={visible} // AntD v5 uyumlu
            onCancel={onCancel}
            width={900} // Geniş modal
            footer={null}
            destroyOnHidden={true} // Modal kapanınca state'i temizler
            maskClosable={false} // Dışarı tıklayınca kapanmasın
            centered
        >
            {/* ADIM GÖSTERGESİ (Stepper) */}
            <Steps current={currentStep} style={{ marginBottom: 24, marginTop: 10 }}>
                <Step 
                    title="Uzman Seçimi" 
                    icon={<UserOutlined />} 
                    disabled={isEditMode} 
                    description={isEditMode ? "Atlandı" : "Müsait Uzmanlar"} 
                />
                <Step 
                    title="Zaman & Yer" 
                    icon={<CalendarOutlined />} 
                    description="Tarih ve Tip" 
                />
                <Step 
                    title={isEditMode ? "Sonuçlandırma" : "Onay"} 
                    icon={isEditMode ? <SolutionOutlined /> : <CheckCircleOutlined />} 
                    description="Tamamla" 
                />
            </Steps>

            <Form form={form} layout="vertical" preserve={false}>
                
                {/* ---------------- ADIM 0: UZMAN SEÇİMİ ---------------- */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    {!isEditMode && (
                        <Card title="Müsait Uzmanları Listele" size="small" style={{ border: '1px solid #d9d9d9' }}>
                            <Form.Item name="categorySelect" label="Uzman Kategorisi Filtrele" initialValue="Tümü" style={{marginBottom: 15}}>
                                <Select size="large" onChange={handleCategoryChange}>
                                    <Option value="Tümü">Tümü</Option>
                                    <Option value="Deneyimli Uzman">Deneyimli Uzman</Option>
                                    <Option value="Gönüllü Uzman">Gönüllü Uzman</Option>
                                    <Option value="BÜREM Uzmanı">BÜREM Uzmanı</Option>
                                    <Option value="İndirimli">İndirimli</Option>
                                </Select>
                            </Form.Item>

                            <Table 
                                dataSource={therapists} 
                                columns={columns} 
                                rowKey="id" 
                                pagination={{ pageSize: 5 }} 
                                size="small"
                                loading={loading}
                                locale={{emptyText: 'Lütfen bir kategori seçiniz veya bekleyiniz.'}}
                            />
                        </Card>
                    )}
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        {!isEditMode && (
                            <Button 
                                type="primary" 
                                size="large" 
                                disabled={!selectedTherapist} 
                                onClick={handleStep1Next}
                            >
                                İleri: Zaman Seçimi <CalendarOutlined />
                            </Button>
                        )}
                    </div>
                </div>

                {/* ---------------- ADIM 1: TARİH VE YER ---------------- */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    {/* Seçilen Uzman Bilgi Kartı */}
                    <Alert 
                        message={`Seçilen Uzman: ${selectedTherapist?.name}`} 
                        description={`Kampüs: ${selectedTherapist?.campus || 'Belirtilmemiş'}`}
                        type="info" 
                        showIcon 
                        style={{marginBottom: 20}} 
                    />

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="date" label="Randevu Tarihi" rules={[{ required: true, message: 'Tarih seçiniz' }]} style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" placeholder="Gün/Ay/Yıl" disabled={isEditMode} /> 
                        </Form.Item>
                        <Form.Item name="time" label="Randevu Saati" rules={[{ required: true, message: 'Saat seçiniz' }]} style={{ flex: 1 }}>
                            <Select placeholder="Saat Seçiniz" disabled={isEditMode}>
                                {/* Mesai saatleri */}
                                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="type" label="Görüşme Türü" rules={[{ required: true, message: 'Tür seçiniz' }]}>
                        <Radio.Group disabled={isEditMode} optionType="button" buttonStyle="solid">
                            <Radio.Button value="Yüzyüze">Yüzyüze Görüşme</Radio.Button>
                            <Radio.Button value="Çevrimiçi">Çevrimiçi (Online)</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                        {({ getFieldValue }) => (
                            <Form.Item 
                                name="roomLink" 
                                label={getFieldValue('type') === 'Çevrimiçi' ? "Zoom/Meet Linki" : "Görüşme Odası / Lokasyon"} 
                                rules={[{ required: true, message: 'Bu alan zorunludur' }]}
                            >
                                {getFieldValue('type') === 'Çevrimiçi' 
                                    ? <Input placeholder="Örn: https://zoom.us/j/123456" prefix={<GlobalOutlined />} />
                                    : <Select placeholder="Oda Seçiniz">
                                        <Option value="Kuzey Oda 1">Kuzey Kampüs - Oda 1</Option>
                                        <Option value="Kuzey Oda 2">Kuzey Kampüs - Oda 2</Option>
                                        <Option value="Güney Oda 3">Güney Kampüs - Oda 3</Option>
                                        <Option value="Sarıtepe Oda 1">Sarıtepe Kampüs - Oda 1</Option>
                                      </Select>
                                }
                            </Form.Item>
                        )}
                    </Form.Item>

                    {/* SADECE DÜZENLEME MODUNDA GÖRÜNEN EK ALANLAR */}
                    {isEditMode && (
                        <div style={{ marginTop: 20, padding: 20, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
                            <h4 style={{fontWeight:'bold', color: '#faad14'}}><EditOutlined /> Durum Güncelleme</h4>
                            <Divider style={{margin: '10px 0'}} />
                            
                            <Form.Item label="Randevu Durumu">
                                <Select value={status} onChange={setStatus} style={{ width: '100%' }}>
                                    <Option value={AppointmentStatus.Planned}>📅 Planlandı (Bekleniyor)</Option>
                                    <Option value={AppointmentStatus.Completed}>✅ Tamamlandı (Geldi)</Option>
                                    <Option value={AppointmentStatus.NoShow}>❌ Gelmedi (No-Show)</Option>
                                    <Option value={AppointmentStatus.Cancelled}>🚫 İptal Edildi</Option>
                                </Select>
                            </Form.Item>
                            
                            {(status === AppointmentStatus.Cancelled || status === AppointmentStatus.NoShow) && (
                                <Form.Item label="İptal / Gelmeme Nedeni" required>
                                    <TextArea rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Nedenini belirtiniz..." />
                                </Form.Item>
                            )}

                            {/* Sadece Tamamlandı ise notlar açılır */}
                            {status === AppointmentStatus.Completed && (
                                <>
                                    <Form.Item label="Klinik Notlar (Sadece Terapist Görür)">
                                        <TextArea rows={3} value={therapistNotes} onChange={e => setTherapistNotes(e.target.value)} />
                                    </Form.Item>
                                    <Space style={{width: '100%'}}>
                                        <Form.Item label="Risk Seviyesi" style={{width: 200}}>
                                            <Select value={riskLevel} onChange={setRiskLevel}>
                                                <Option value="Yok">Yok</Option>
                                                <Option value="Düşük">Düşük</Option>
                                                <Option value="Orta">Orta</Option>
                                                <Option value="Yüksek">Yüksek</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item label="Yönlendirme" style={{width: 200}}>
                                            <Select value={referral} onChange={setReferral} allowClear>
                                                <Option value="BÜPAM">BÜPAM</Option>
                                                <Option value="Hastane">Hastane</Option>
                                            </Select>
                                        </Form.Item>
                                    </Space>
                                </>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            {!isEditMode && <Button onClick={() => setCurrentStep(0)}>Geri</Button>}
                            <Button 
                                type="primary" 
                                size="large" 
                                onClick={isEditMode ? handleFinish : handleStep2Next}
                            >
                                {isEditMode ? "Kaydet ve Bitir" : "İleri: Onay"}
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* ---------------- ADIM 2: ONAY ---------------- */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <div style={{textAlign: 'center', marginBottom: 20}}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 10 }} />
                        <h3>Randevu Onayı</h3>
                        <p>Aşağıdaki bilgileri kontrol edip onaylayınız.</p>
                    </div>

                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Öğrenci Adı">{studentName}</Descriptions.Item>
                        <Descriptions.Item label="Terapist">{selectedTherapist?.name}</Descriptions.Item>
                        <Descriptions.Item label="Tarih ve Saat">
                            <span style={{fontWeight:'bold', color: PRIMARY_COLOR}}>
                                {form.getFieldValue('date')?.format('DD.MM.YYYY')} - {form.getFieldValue('time')}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Görüşme Tipi">{form.getFieldValue('type')}</Descriptions.Item>
                        <Descriptions.Item label="Yer / Link">{form.getFieldValue('roomLink')}</Descriptions.Item>
                    </Descriptions>

                    <Alert 
                        message="Bilgilendirme" 
                        description="İşlem onaylandığında öğrenciye ve terapiste otomatik bilgilendirme e-postası gönderilecektir." 
                        type="info" 
                        showIcon 
                        style={{ marginTop: 20 }} 
                    />

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCurrentStep(1)}>Geri</Button>
                            <Button 
                                type="primary" 
                                size="large" 
                                onClick={handleFinish} 
                                loading={loading} 
                                style={{backgroundColor: '#52c41a', borderColor: '#52c41a'}}
                            >
                                Onayla ve Oluştur
                            </Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default AppointmentModal;