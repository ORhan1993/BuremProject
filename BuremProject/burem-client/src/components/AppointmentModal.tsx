import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Select, DatePicker, Input, Radio, Table, Tag, Button, message, Descriptions } from 'antd';
import { UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import agent, { TherapistAvailability } from '../api/agent';
import moment from 'moment';

const { Step } = Steps;
const { Option } = Select;

interface Props {
    visible: boolean;
    onCancel: () => void;
    sessionId: number;
    studentName: string;
    studentCampus?: string; // Öğrencinin kampüsü (Eşleştirme için)
}

const AppointmentModal = ({ visible, onCancel, sessionId, studentName, studentCampus }: Props) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistAvailability | null>(null);
    const [form] = Form.useForm();

    // Adım 1: Kategori Seçimi ve Terapist Listeleme
    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            setTherapists(data);
        } finally {
            setLoading(false);
        }
    };

    // Tablo Kolonları (Analizdeki bilgiler)
    const columns = [
        { title: 'Uzman', dataIndex: 'name', key: 'name' },
        { title: 'Kampüs', dataIndex: 'campus', key: 'campus', render: (text: string) => (
            <Tag color={text === studentCampus ? 'green' : 'blue'}>{text}</Tag>
        )},
        { title: 'Mevcut Yük', dataIndex: 'currentLoad', key: 'load' },
        { title: 'Müsait Slot', dataIndex: 'dailySlots', key: 'slots' },
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

    // Son Adım: Kaydet
    const handleFinish = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await agent.Appointments.create({
                sessionId,
                therapistId: selectedTherapist!.id,
                date: values.date.format('DD.MM.YYYY'),
                time: values.time,
                type: values.type,
                roomLink: values.roomLink
            });

            message.success('Randevu oluşturuldu ve öğrenciye e-posta gönderildi.');
            onCancel();
            setCurrentStep(0);
            form.resetFields();
        } catch (error) {
            message.error('İşlem başarısız.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Terapiste Yönlendir ve Randevu Oluştur"
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={null}
            destroyOnClose
        >
            <Steps current={currentStep} style={{ marginBottom: 20 }}>
                <Step title="Uzman Seçimi" icon={<UserOutlined />} />
                <Step title="Zaman & Yer" icon={<CalendarOutlined />} />
                <Step title="Onay" icon={<CheckCircleOutlined />} />
            </Steps>

            <Form form={form} layout="vertical">
                {/* --- ADIM 1: TERAPİST SEÇİMİ --- */}
                {currentStep === 0 && (
                    <div>
                        <Form.Item label="Uzman Kategorisi Seçiniz" style={{marginBottom: 15}}>
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
                            locale={{emptyText: 'Lütfen kategori seçiniz.'}}
                        />
                        
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button type="primary" disabled={!selectedTherapist} onClick={() => setCurrentStep(1)}>
                                İleri
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- ADIM 2: TARİH VE TÜR SEÇİMİ --- */}
                {currentStep === 1 && (
                    <div>
                        <Descriptions title="Seçilen Uzman" size="small" bordered style={{marginBottom: 20}}>
                            <Descriptions.Item label="Ad Soyad">{selectedTherapist?.name}</Descriptions.Item>
                            <Descriptions.Item label="Kampüs">{selectedTherapist?.campus}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <Form.Item name="date" label="Tarih" rules={[{ required: true }]} style={{ flex: 1 }}>
                                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                            </Form.Item>
                            <Form.Item name="time" label="Saat" rules={[{ required: true }]} style={{ flex: 1 }}>
                                <Select placeholder="Saat Seçiniz">
                                    <Option value="09:00">09:00</Option>
                                    <Option value="10:00">10:00</Option>
                                    <Option value="11:00">11:00</Option>
                                    <Option value="13:00">13:00</Option>
                                    <Option value="14:00">14:00</Option>
                                    <Option value="15:00">15:00</Option>
                                </Select>
                            </Form.Item>
                        </div>

                        <Form.Item name="type" label="Görüşme Türü" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="Yüz Yüze">Yüz Yüze</Radio>
                                <Radio value="Online">Online</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item 
                            noStyle 
                            shouldUpdate={(prev, curr) => prev.type !== curr.type}
                        >
                            {({ getFieldValue }) => (
                                <Form.Item 
                                    name="roomLink" 
                                    label={getFieldValue('type') === 'Online' ? "Zoom/Meet Linki" : "Görüşme Odası"} 
                                    rules={[{ required: true }]}
                                >
                                    {getFieldValue('type') === 'Online' 
                                        ? <Input placeholder="https://..." />
                                        : <Select placeholder="Oda Seçiniz">
                                            <Option value="Kuzey Oda 1">Kuzey Oda 1</Option>
                                            <Option value="Güney Oda 3">Güney Oda 3</Option>
                                          </Select>
                                    }
                                </Form.Item>
                            )}
                        </Form.Item>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(0)}>Geri</Button>
                            <Button type="primary" onClick={() => setCurrentStep(2)}>İleri</Button>
                        </div>
                    </div>
                )}

                {/* --- ADIM 3: ÖZET VE ONAY --- */}
                {currentStep === 2 && (
                    <div>
                        <Alert 
                            message="Dikkat" 
                            description="Onayladığınızda öğrenciye otomatik bilgilendirme e-postası gönderilecektir." 
                            type="warning" 
                            showIcon 
                            style={{ marginBottom: 20 }} 
                        />

                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Öğrenci">{studentName}</Descriptions.Item>
                            <Descriptions.Item label="Terapist">{selectedTherapist?.name}</Descriptions.Item>
                            <Descriptions.Item label="Tarih & Saat">
                                {form.getFieldValue('date')?.format('DD.MM.YYYY')} - {form.getFieldValue('time')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tür">{form.getFieldValue('type')}</Descriptions.Item>
                            <Descriptions.Item label="Yer/Link">{form.getFieldValue('roomLink')}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(1)}>Geri</Button>
                            <Button type="primary" onClick={handleFinish} loading={loading}>Randevuyu Oluştur</Button>
                        </div>
                    </div>
                )}
            </Form>
        </Modal>
    );
};

export default AppointmentModal;