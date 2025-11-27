import React, { useState } from 'react';
import { Layout, Typography, Card, Steps, Form, Radio, Input, Button, message, Divider, Alert, Rate } from 'antd';
import { CheckCircleOutlined, SmileOutlined, SolutionOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const questions = {
    service: [
        "İlk başvurunuzda ve seansta iyi karşılandığınızı düşündünüz mü?",
        "Sizinle nasıl bir çalışma yürütüleceği ve sürece dair verilen bilgiler açıklayıcı mıydı?",
        "Randevu planlama süreci sorunsuz işledi mi?",
        "Görüşme odasının fiziki koşulları (ses, ısı, ışık) uygun muydu?"
    ],
    therapist: [
        "Terapistinizin sizi dikkatle dinlediğini hissettiniz mi?",
        "Terapistinizin sorunlarınızı ve hislerinizi anladığını düşündünüz mü?",
        "Terapiniz boyunca saygı ve etik kurallar çerçevesinde muamele gördünüz mü?",
        "Terapistinizle kurduğunuz iletişimden memnun kaldınız mı?"
    ],
    outcome: [
        "Almış olduğunuz psikolojik destekten genel olarak memnun kaldınız mı?",
        "Bu süreç sıkıntılarınızla daha iyi başa çıkmanıza yardımcı oldu mu?",
        "Benzer sıkıntıları olan bir arkadaşınıza BÜREM'i tavsiye eder miydiniz?"
    ]
};

const EvaluationForm = () => {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Success:', values);
        message.success('Değerlendirme formunuz başarıyla iletildi. Teşekkür ederiz!');
        // Backend API call here -> agent.Evaluation.submit(values);
        setTimeout(() => {
            navigate('/student');
        }, 2000);
    };

    const next = () => {
        form.validateFields().then(() => {
            setCurrent(current + 1);
            window.scrollTo(0, 0);
        });
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    // Adım İçerikleri
    const steps = [
        {
            title: 'Hizmet & Süreç',
            icon: <SolutionOutlined />,
            content: (
                <>
                    <Alert message="Lütfen BÜREM'den aldığınız hizmeti aşağıdaki sorulara göre değerlendiriniz." type="info" showIcon style={{ marginBottom: 24 }} />
                    {questions.service.map((q, i) => (
                        <Form.Item key={`srv_${i}`} name={`service_q${i}`} label={q} rules={[{ required: true, message: 'Lütfen bir seçenek belirtiniz' }]}>
                            <Radio.Group>
                                <Radio value={1}>Hayır</Radio>
                                <Radio value={2}>Kısmen</Radio>
                                <Radio value={3}>Evet</Radio>
                            </Radio.Group>
                        </Form.Item>
                    ))}
                    <Divider />
                    {questions.outcome.map((q, i) => (
                        <Form.Item key={`out_${i}`} name={`outcome_q${i}`} label={q} rules={[{ required: true, message: 'Lütfen bir seçenek belirtiniz' }]}>
                            <Radio.Group>
                                <Radio value={1}>Hayır</Radio>
                                <Radio value={2}>Kısmen</Radio>
                                <Radio value={3}>Evet</Radio>
                            </Radio.Group>
                        </Form.Item>
                    ))}
                </>
            )
        },
        {
            title: 'Terapist Değerlendirmesi',
            icon: <SmileOutlined />,
            content: (
                <>
                    <Alert message="Terapistinizle olan sürecinizi değerlendiriniz." type="warning" showIcon style={{ marginBottom: 24 }} />
                    {questions.therapist.map((q, i) => (
                        <Form.Item key={`trp_${i}`} name={`therapist_q${i}`} label={q} rules={[{ required: true, message: 'Lütfen bir seçenek belirtiniz' }]}>
                            <Radio.Group>
                                <Radio value={1}>Hiç Katılmıyorum</Radio>
                                <Radio value={2}>Katılmıyorum</Radio>
                                <Radio value={3}>Kararsızım</Radio>
                                <Radio value={4}>Katılıyorum</Radio>
                                <Radio value={5}>Tamamen Katılıyorum</Radio>
                            </Radio.Group>
                        </Form.Item>
                    ))}
                    <Form.Item name="therapist_comment" label="Terapistiniz veya süreç hakkında eklemek istedikleriniz">
                        <TextArea rows={4} placeholder="Görüş ve önerilerinizi buraya yazabilirsiniz..." />
                    </Form.Item>
                </>
            )
        },
        {
            title: 'Son Durum Ölçekleri',
            icon: <MedicineBoxOutlined />,
            content: (
                <>
                    <Alert 
                        message="Son Durum Analizi" 
                        description="Başvuru sırasında doldurduğunuz şikayet ölçeklerini, şu anki durumunuzu anlamamız için lütfen tekrar cevaplayınız. (Son 2 hafta baz alınacaktır)" 
                        type="info" 
                        showIcon 
                        style={{ marginBottom: 24 }} 
                    />
                    
                    <Title level={5}>Genel Kaygı ve Duygu Durumu</Title>
                    {[
                        "Kendinizi sinirli, kaygılı veya çok gergin hissetme",
                        "Endişelenmekten kendinizi alıkoyamama",
                        "Rahatlamada güçlük çekme",
                        "Çok kötü bir şey olacakmış gibi hissetme"
                    ].map((q, i) => (
                        <Card key={`gad_${i}`} size="small" style={{ marginBottom: 10 }}>
                            <Form.Item name={`gad_q${i}`} label={q} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Zorunlu alan' }]}>
                                <Radio.Group style={{ width: '100%' }}>
                                    <Radio value={0}>Hiç</Radio>
                                    <Radio value={1}>Biraz</Radio>
                                    <Radio value={2}>Oldukça</Radio>
                                    <Radio value={3}>Çok</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Card>
                    ))}

                    <Title level={5} style={{ marginTop: 20 }}>Depresyon Belirtileri</Title>
                    {[
                        "İlgi kaybı veya zevk alamama",
                        "Moral bozukluğu, depresif hissetme",
                        "Uykuya dalmada güçlük veya çok uyuma",
                        "Yorgunluk veya enerji düşüklüğü"
                    ].map((q, i) => (
                        <Card key={`phq_${i}`} size="small" style={{ marginBottom: 10 }}>
                            <Form.Item name={`phq_q${i}`} label={q} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Zorunlu alan' }]}>
                                <Radio.Group style={{ width: '100%' }}>
                                    <Radio value={0}>Hiç</Radio>
                                    <Radio value={1}>Biraz</Radio>
                                    <Radio value={2}>Oldukça</Radio>
                                    <Radio value={3}>Çok</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Card>
                    ))}
                </>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{ background: '#003366', padding: '0 24px' }}>
                <Title level={3} style={{ color: 'white', margin: '14px 0' }}>Süreç Değerlendirme Formu</Title>
            </Header>
            <Content style={{ padding: '24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
                <Card>
                    <Steps current={current} items={steps.map(item => ({ title: item.title, icon: item.icon }))} style={{ marginBottom: 30 }} />
                    
                    <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>
                        <div style={{ minHeight: '40vh' }}>
                            {steps[current].content}
                        </div>

                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            {current > 0 && (
                                <Button style={{ margin: '0 8px' }} onClick={prev}>
                                    Geri
                                </Button>
                            )}
                            {current < steps.length - 1 && (
                                <Button type="primary" onClick={next}>
                                    İleri
                                </Button>
                            )}
                            {current === steps.length - 1 && (
                                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                                    Değerlendirmeyi Tamamla
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Bürem ©2025 Boğaziçi Üniversitesi</Footer>
        </Layout>
    );
};

export default EvaluationForm;