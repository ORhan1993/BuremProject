import { useState, useEffect } from 'react';
import { Modal, Steps, Form, Select, DatePicker, Input, Radio, Table, Tag, Button, message, Descriptions, Alert, Space } from 'antd';
import { UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import agent from '../api/agent';
import type { TherapistAvailability } from '../api/agent'; // 'type' eklendi
import dayjs from 'dayjs'; // Moment yerine Dayjs kullanıyoruz

const { Step } = Steps;
const { Option } = Select;

interface Props {
    visible: boolean;
    onCancel: () => void;
    sessionId: number;
    studentName: string;
    studentCampus?: string;
}

const AppointmentModal = ({ visible, onCancel, sessionId, studentName, studentCampus }: Props) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [therapists, setTherapists] = useState<TherapistAvailability[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistAvailability | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (!visible) {
            setCurrentStep(0);
            form.resetFields();
            setSelectedTherapist(null);
            setTherapists([]);
        }
    }, [visible, form]);

    const handleCategoryChange = async (category: string) => {
        setLoading(true);
        try {
            const data = await agent.Appointments.getAvailableTherapists(category);
            setTherapists(data);
        } finally {
            setLoading(false);
        }
    };

    // 2. Adım Validasyonu
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
            const values = form.getFieldsValue();
            
            // Backend dd.MM.yyyy formatı bekliyor
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
            onCancel();
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'İşlem başarısız.';
            message.error(typeof errorMsg === 'string' ? errorMsg : 'İşlem başarısız.');
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
            width={800}
            footer={null}
            destroyOnClose={true}
            maskClosable={false}
        >
            <Steps current={currentStep} style={{ marginBottom: 20 }}>
                <Step title="Uzman" icon={<UserOutlined />} />
                <Step title="Zaman & Yer" icon={<CalendarOutlined />} />
                <Step title="Onay" icon={<CheckCircleOutlined />} />
            </Steps>

            <Form form={form} layout="vertical" preserve={true}>
                {/* ADIM 0: UZMAN SEÇİMİ */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
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
                            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                        </Form.Item>
                        <Form.Item name="time" label="Saat" rules={[{ required: true, message: 'Saat seçiniz' }]} style={{ flex: 1 }}>
                            <Select placeholder="Saat Seçiniz">
                                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="type" label="Görüşme Türü" rules={[{ required: true, message: 'Tür seçiniz' }]}>
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
                                rules={[{ required: true, message: 'Bu alan zorunludur' }]}
                            >
                                {getFieldValue('type') === 'Online' 
                                    ? <Input placeholder="https://zoom.us/..." />
                                    : <Select placeholder="Oda Seçiniz">
                                        <Option value="Kuzey Oda 1">Kuzey Oda 1</Option>
                                        <Option value="Güney Oda 3">Güney Oda 3</Option>
                                      </Select>
                                }
                            </Form.Item>
                        )}
                    </Form.Item>

                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCurrentStep(0)}>Geri</Button>
                            <Button type="primary" onClick={handleStep1Next}>İleri</Button>
                        </Space>
                    </div>
                </div>

                {/* ADIM 2: ONAY */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <Alert message="Dikkat: Onayladığınızda öğrenciye mail gönderilecektir." type="warning" showIcon style={{ marginBottom: 20 }} />

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
                        <Space>
                            <Button onClick={() => setCurrentStep(1)}>Geri</Button>
                            <Button type="primary" onClick={handleFinish} loading={loading}>Randevuyu Oluştur</Button>
                        </Space>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default AppointmentModal;