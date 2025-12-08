import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import agent from "../api/agent";
import type { SiteContent, Question } from "../api/agent"; 
import { 
    Card, Spin, Typography, Input, Checkbox, Space, Button, Modal, 
    Layout, theme, Alert, Radio, Steps, Form, Select, Row, Col, 
    message, Divider, DatePicker 
} from "antd";
import { SoundOutlined, SafetyCertificateOutlined, LogoutOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// --- TİP TANIMLARI ---
interface ProfileData { 
    studentNo: string; 
    submissionDate: string; 
    firstName: string; 
    lastName: string; 
    birthYear: string; 
    gender: string; 
    lifestyle: string; 
    mobile: string; 
    email: string; 
    contactDegree: string; 
    contactPerson: string; 
    contactPhone: string; 
    faculty: string; 
    department: string; 
    semester: string; 
    academicLevel: string; 
    scholarship: string; 
    isMotherAlive: string; 
    isFatherAlive: string;
    parentMarriage: string;
}

// Varsayılan içerik
const defaultContent = [
    { key: 'Announcement_Title', value: '<h3 style="color:#d32f2f; margin:0;">ÖNEMLİ BİLGİLENDİRME</h3>' },
    { key: 'Announcement_Body', value: '<p>BÜREM Başvuru formunu doldurmadan önce lütfen çalışma ilkelerimiz ve yöntemlerimizle ilgili bilgilendirme metnini okuyunuz.</p>' },
    { key: 'Consent_Checkbox_label_1', value: 'Aydınlatma metnini okudum, anladım ve kabul ediyorum.' },
    { key: 'Consent_Footer_p_1', value: '<p style="font-size:12px; color:#999; margin-top:10px;">BÜREM İletişim</p>' },
    { key: 'Consent_1', value: '<p>Kişisel verilerinizin işlenmesine ilişkin aydınlatma metni...</p>' },
];

function StudentForm() {
    const navigate = useNavigate();
    const [contentList, setContentList] = useState<SiteContent[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]); 
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
  
    const [answers, setAnswers] = useState<Record<string, any>>({});
  
    const [profileData, setProfileData] = useState<ProfileData>({ 
        studentNo: "2024001", 
        submissionDate: new Date().toLocaleDateString('tr-TR'), 
        firstName: "", lastName: "", birthYear: "", gender: "", lifestyle: "", mobile: "", email: "", 
        contactDegree: "", contactPerson: "", contactPhone: "", faculty: "", department: "", 
        semester: "", academicLevel: "", scholarship: "", 
        isMotherAlive: "", isFatherAlive: "", parentMarriage: "" 
    });
  
    const [showAnnouncement, setShowAnnouncement] = useState(false);
    const [showConsent, setShowConsent] = useState(false);      
    const [isConsentAccepted, setIsConsentAccepted] = useState(false); 
    const [canViewForm, setCanViewForm] = useState(false);      
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

    const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

    useEffect(() => {
        const loadData = async () => {
            try {
                const contentRes = await agent.Content.getAll();
                setContentList(contentRes && contentRes.length > 0 ? contentRes : defaultContent);
                const questionsRes = await agent.Forms.listQuestions();
                setQuestions(questionsRes || []);
            } catch (err) { 
                console.error("Veri yükleme hatası:", err);
                setContentList(defaultContent); 
            } finally { 
                setLoading(false); 
                setShowAnnouncement(true); 
            }
        };
        loadData();
    }, []);

    const getContent = (key: string) => { const item = contentList.find(c => c.key === key); return item ? item.value : (defaultContent.find(d=>d.key===key)?.value || ''); };
    const getConsentBodyItems = () => { let items = contentList.filter(c => c.key.startsWith('Consent_') && c.key !== 'Consent_Checkbox_label_1' && c.key !== 'Consent_Footer_p_1'); return items.length > 0 ? items : defaultContent.filter(c => c.key.startsWith('Consent_') && c.key !== 'Consent_Footer_p_1'); };
    const consentBodyItems = getConsentBodyItems();

    const handleProfileChange = (f: keyof ProfileData, v: any) => setProfileData(p => ({ ...p, [f]: v }));
  
    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const next = () => { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); };
    const prev = () => { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); };

    const handleSubmitForm = async () => {
        const formattedAnswers = Object.keys(answers).map(key => {
            const val = answers[key];
            let strValue = "";
            if (val && typeof val === 'object' && val.format) {
                strValue = val.format("DD.MM.YYYY");
            } else if (Array.isArray(val)) {
                strValue = val.join(',');
            } else {
                strValue = (val?.toString() || "");
            }
            return { questionId: parseInt(key), value: strValue };
        });

        const payload = {
            ...profileData,
            answers: formattedAnswers 
        };

        try {
            await agent.Students.apply(payload);
            message.success("Başvurunuz başarıyla kaydedildi!");
            navigate('/'); 
        } catch (error: any) {
            console.error("Gönderim hatası:", error);
            if (error.response && error.response.data) {
                message.error(`Hata: ${JSON.stringify(error.response.data)}`);
            } else {
                message.error("Başvuru gönderilirken bir hata oluştu.");
            }
        }
    };

    const renderQuestionInput = (q: any) => {
        const typeId = parseInt(q.questionType ?? q.QuestionType ?? "0", 10);
        const rawOptions = q.options || [];
        const validOptions = rawOptions
            .filter((opt: any) => {
                const text = opt.optionTitle || opt.text || "";
                return (opt.optionValue !== "99" && opt.optionValue !== 99) && text !== "Seçiniz"; 
            })
            .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

        switch (typeId) {
            case 1: 
                // GÜNCELLEME: Seçenekler yan yana (Space wrap)
                return (
                    <Radio.Group onChange={e => handleAnswerChange(q.id, e.target.value)} value={answers[q.id]}>
                        <Space wrap> 
                            {validOptions.map((opt: any) => (
                                <Radio key={opt.id} value={opt.optionValue} style={{marginRight: 16}}>
                                    {opt.optionTitle || opt.text}
                                </Radio>
                            ))}
                        </Space>
                    </Radio.Group>
                );
            case 2: 
                return (
                    <Select
                        placeholder="Seçiniz"
                        style={{ width: '100%', maxWidth: '400px' }}
                        onChange={value => handleAnswerChange(q.id, value)}
                        value={answers[q.id]}
                        options={validOptions.map((opt: any) => ({ label: opt.optionTitle || opt.text, value: opt.optionValue }))}
                    />
                );
            case 3: 
                // GÜNCELLEME: Seçenekler yan yana (Space wrap, vertical Row/Col kaldırıldı)
                return (
                    <Checkbox.Group style={{ width: '100%' }} onChange={(v) => handleAnswerChange(q.id, v)} value={answers[q.id]}>
                        <Space wrap>
                            {validOptions.map((opt: any) => (
                                <Checkbox key={opt.id} value={opt.optionValue} style={{marginRight: 16}}>
                                    {opt.optionTitle || opt.text}
                                </Checkbox>
                            ))}
                        </Space>
                    </Checkbox.Group>
                );
            case 4:
                return (<DatePicker style={{ width: '100%', maxWidth: '200px' }} format="DD.MM.YYYY" placeholder="Tarih Seçiniz" onChange={(d) => handleAnswerChange(q.id, d)} value={answers[q.id]} />);
            default:
                return (<TextArea rows={3} onChange={e => handleAnswerChange(q.id, e.target.value)} value={answers[q.id]} placeholder="Cevabınızı buraya yazınız..." />);
        }
    };

    const renderDynamicStep = (groupId: number, title: string, description: React.ReactNode) => {
        const groupQuestions = questions
            .filter((q: any) => {
                const gId = q.questionGroup !== undefined ? q.questionGroup : (q.questionGroupId !== undefined ? q.questionGroupId : q.QuestionGroup);
                return gId === groupId;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (groupQuestions.length === 0) return <div key={groupId}><Text>Bu bölümde soru bulunmamaktadır.</Text></div>;

        return (
            <div key={groupId}>
                <div style={{ marginBottom: 20 }}>
                   {title && <><Text strong style={{fontSize:16}}>{title}</Text><br /></>}
                   <Text style={{color: 'rgba(0, 0, 0, 0.88)'}}>{description}</Text>
                </div>
                {groupQuestions.map((q) => (
                    <Card key={q.id} size="small" style={{ marginBottom: 15 }} variant="borderless" className="shadow-sm">
                        <Row gutter={[16, 16]}> 
                            <Col xs={24} md={12}>{q.sortOrder ? <Text strong>{q.sortOrder}. </Text> : ''}<Text>{q.questionTitle || q.text}</Text></Col>
                            <Col xs={24} md={12}>{renderQuestionInput(q)}</Col>
                        </Row>
                    </Card>
                ))}
            </div>
        );
    };

    // --- PROFİL FORMU ---
    const renderProfileStep = () => (
        <Form layout="vertical" style={{ marginTop: 20 }}>
            <Alert message="Haftaiçi saat 8:00 ile 17:00 arasında formu doldurabilirsiniz." type="info" showIcon style={{marginBottom: 20}} />
            <Row gutter={16}><Col xs={24} md={12}><Form.Item label="Öğrenci No"><Input value={profileData.studentNo} disabled /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Tarih"><Input value={profileData.submissionDate} disabled /></Form.Item></Col></Row>
            <Row gutter={16}><Col xs={24} md={12}><Form.Item label="Adı" required><Input value={profileData.firstName} onChange={e => handleProfileChange('firstName', e.target.value)} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Soyadı" required><Input value={profileData.lastName} onChange={e => handleProfileChange('lastName', e.target.value)} /></Form.Item></Col></Row>
            <Row gutter={16}><Col xs={24} md={12}><Form.Item label="Doğum Yılı" required><Select onChange={v => handleProfileChange('birthYear', v)} value={profileData.birthYear}>{Array.from({length: 40}, (_, i) => new Date().getFullYear() - 17 - i).map(y => <Option key={y} value={y.toString()}>{y}</Option>)}</Select></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Cinsiyet" required><Select onChange={v => handleProfileChange('gender', v)} value={profileData.gender}><Option value="Kadin">Kadın</Option><Option value="Erkek">Erkek</Option></Select></Form.Item></Col></Row>
            <Form.Item label="Yaşama Biçimi" required><Select onChange={v => handleProfileChange('lifestyle', v)} value={profileData.lifestyle}><Option value="Aile">Ailemle</Option><Option value="Yurt">Yurtta</Option><Option value="OgrenciEvi">Öğrenci Evi</Option></Select></Form.Item>
            <Form.Item label="Telefonu" required><Input value={profileData.mobile} onChange={e => handleProfileChange('mobile', e.target.value)} placeholder="5XX-XXX-XXXX" /></Form.Item>
            <Form.Item label="E-posta Adresi" required><Input value={profileData.email} onChange={e => handleProfileChange('email', e.target.value)} /></Form.Item>
            
            <Divider orientation="left">Acil Durum</Divider>
            <Row gutter={16}><Col xs={24} md={8}><Form.Item label="Yakınlık"><Input value={profileData.contactDegree} onChange={e => handleProfileChange('contactDegree', e.target.value)} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Adı Soyadı"><Input value={profileData.contactPerson} onChange={e => handleProfileChange('contactPerson', e.target.value)} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Telefonu"><Input value={profileData.contactPhone} onChange={e => handleProfileChange('contactPhone', e.target.value)} /></Form.Item></Col></Row>
            
            <Divider orientation="left">Akademik</Divider>
            <Row gutter={16}><Col xs={24} md={12}><Form.Item label="Fakülte"><Select onChange={v => handleProfileChange('faculty', v)} value={profileData.faculty}><Option value="Muhendislik">Mühendislik</Option><Option value="FenEdebiyat">Fen-Edebiyat</Option></Select></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Bölüm"><Select onChange={v => handleProfileChange('department', v)} value={profileData.department}><Option value="CENG">Bilgisayar Müh.</Option><Option value="MIS">YBS</Option></Select></Form.Item></Col></Row>
            <Row gutter={16}><Col xs={24} md={8}><Form.Item label="Dönem"><Input value={profileData.semester} onChange={e => handleProfileChange('semester', e.target.value)} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Akademik Düzey"><Select onChange={v => handleProfileChange('academicLevel', v)} value={profileData.academicLevel}><Option value="Lisans">Lisans</Option><Option value="Yuksek">Yüksek Lisans</Option></Select></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Burs"><Select onChange={v => handleProfileChange('scholarship', v)} value={profileData.scholarship}><Option value="Var">Var</Option><Option value="Yok">Yok</Option></Select></Form.Item></Col></Row>
            
            <Divider orientation="left">Aile Bilgileri</Divider>
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item label="Anne Hayatta mı?">
                        <Select onChange={v => handleProfileChange('isMotherAlive', v)} value={profileData.isMotherAlive}>
                            <Option value="Sag">Sağ</Option>
                            <Option value="Vefat">Vefat</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item label="Baba Hayatta mı?">
                        <Select onChange={v => handleProfileChange('isFatherAlive', v)} value={profileData.isFatherAlive}>
                            <Option value="Sag">Sağ</Option>
                            <Option value="Vefat">Vefat</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item label="Anne-Baba Evlilik Durumu">
                         <Select onChange={v => handleProfileChange('parentMarriage', v)} value={profileData.parentMarriage}>
                            <Option value="Evli">Evli</Option>
                            <Option value="Bosanmis">Boşanmış</Option>
                            <Option value="Ayri">Ayrı Yaşıyor</Option>
                            <Option value="Vefat">Biri/İkisi Vefat</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );

    const steps = [ 
        { title: '1. Profil', content: renderProfileStep() }, 
        { 
            title: '2. Genel', 
            content: renderDynamicStep(1, "", 
            <span>
                Aşağıda belirtilen konularda <b>şu anda</b> ne derecede sıkıntı yaşıyorsunuz? Lütfen hiçbir maddeyi atlamadan işaretleyiniz.
                <br /><br />
                0= Hiç 1= Biraz 2= Oldukça 3= Çok
            </span>) 
        }, 
        { 
            title: '3. Psikolojik', 
            content: renderDynamicStep(2, "", 
            <span>
                <b>Son 2 hafta içerisinde</b> aşağıdaki sorular sizi ne sıklıkla rahatsız etti? Lütfen hiçbir maddeyi atlamadan işaretleyiniz.
                <br /><br />
                0= Hiçbir zaman 1= Bazı günler 2= Haftanın günlerinin yarısından fazlasında 3= Hemen hemen her gün
            </span>) 
        },
        { 
            title: '4. Ek', 
            content: renderDynamicStep(3, "", 
            <span>
                <b>Son 2 hafta içerisinde</b> aşağıdaki sorular sizi ne sıklıkla rahatsız etti? Lütfen hiçbir maddeyi atlamadan işaretleyiniz.
                <br /><br />
                0= Hiçbir zaman 1= Bazı günler 2= Haftanın günlerinin yarısından fazlasında 3= Hemen hemen her gün
            </span>) 
        } 
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Modal open={showAnnouncement} closable={false} centered width={500} footer={[<Button key="ok" type="primary" danger onClick={() => { setShowAnnouncement(false); setTimeout(() => setShowConsent(true), 300); }}>Okudum, Anladım</Button>]}>
                <div dangerouslySetInnerHTML={{ __html: getContent('Announcement_Title') }} />
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px', alignItems: 'flex-start' }}><SoundOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} /><div dangerouslySetInnerHTML={{ __html: getContent('Announcement_Body') }} /></div>
            </Modal>
            <Modal title={<Space><SafetyCertificateOutlined style={{ color: '#52c41a' }} /> <span style={{fontWeight:'bold'}}>AYDINLATMA VE ONAM</span></Space>} open={showConsent} closable={false} centered width={900} footer={[<Button key="submit" type="primary" size="large" disabled={!isConsentAccepted} onClick={() => { setShowConsent(false); setCanViewForm(true); }}>Onayla ve Devam Et</Button>]}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '25px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>{consentBodyItems.map((item) => (<div key={item.key} dangerouslySetInnerHTML={{ __html: item.value }} style={{ marginBottom: '12px' }} />))}<div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee', color: '#666' }} dangerouslySetInnerHTML={{ __html: getContent('Consent_Footer_p_1') }} /></div>
                <div style={{ padding: '20px', background: '#f9f9f9' }}><Alert message={<Checkbox onChange={(e) => setIsConsentAccepted(e.target.checked)}><span style={{ fontWeight: '600' }}>{getContent('Consent_Checkbox_label_1').replace(/<[^>]*>?/gm, '')}</span></Checkbox>} type="info" showIcon={false} /></div>
            </Modal>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#003366', padding: '0 24px' }}><div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>BÜREM</div><div style={{ color: 'white' }}><span>Öğrenci</span><Button type="text" icon={<LogoutOutlined />} style={{ color: '#ffccc7', marginLeft: 10 }} onClick={handleLogout}>Çıkış</Button></div></Header>
            <Content style={{ padding: '24px 48px', marginTop: 20 }}>{!canViewForm ? <div style={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div> : <div style={{ maxWidth: 900, margin: '0 auto' }}><div style={{ background: colorBgContainer, padding: 40, borderRadius: borderRadiusLG }}><div style={{ textAlign: 'center', marginBottom: 40 }}><Title level={2} style={{ color: '#003366' }}>Öğrenci Başvuru Formu</Title></div><Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} size="small" style={{marginBottom:30}} /><div style={{ minHeight: 300 }}>{steps[currentStep].content}</div><div style={{ textAlign: 'center', marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>{currentStep > 0 ? <Button size="large" onClick={prev}>Geri</Button> : <div></div>}{currentStep < steps.length - 1 && <Button type="primary" size="large" onClick={next}>İleri</Button>}{currentStep === steps.length - 1 && <Button type="primary" danger size="large" icon={<SaveOutlined />} onClick={handleSubmitForm}>Formu Gönder</Button>}</div></div></div>}</Content>
            <Footer style={{ textAlign: 'center', color: '#888' }}>Bürem ©2025 Boğaziçi Üniversitesi</Footer>
        </Layout>
    );
}
export default StudentForm;