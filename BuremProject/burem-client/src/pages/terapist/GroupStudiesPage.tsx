import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, InputNumber, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import agent from '../../api/agent';
import dayjs from 'dayjs';

const { Option } = Select;

const GroupStudiesPage = () => {
    const [groups, setGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Terapist ID'sini Login olan kullanıcıdan almalısınız. 
    // Şimdilik örnek olarak 1 veriyorum veya localStorage'dan çekmelisiniz.
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const therapistId = currentUser.id || 0; // Gerçek uygulamada düzeltilmeli

    const fetchGroups = async () => {
        if(!therapistId) return;
        try {
            const response = await agent.Groups.list(therapistId);
            setGroups(response);
        } catch (error) {
            console.error("Gruplar yüklenemedi", error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreate = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                therapistId: therapistId,
                groupName: values.groupName,
                startDate: values.startDate ? values.startDate.format('DD.MM.YYYY') : null,
                endDate: values.endDate ? values.endDate.format('DD.MM.YYYY') : null,
                sessionCount: values.sessionCount,
                completionStatus: values.completionStatus
            };

            await agent.Groups.create(payload);
            message.success('Grup çalışması başarıyla kaydedildi.');
            setIsModalOpen(false);
            form.resetFields();
            fetchGroups(); // Listeyi yenile
        } catch (error) {
            message.error('Kayıt başarısız.');
        } finally {
            setLoading(false);
        }
    };

    // Tablo Kolonları
    const columns = [
        { title: 'Grup Adı', dataIndex: 'groupName', key: 'groupName' },
        { title: 'Başlangıç', dataIndex: 'startDate', key: 'startDate', render: (d: string) => d ? dayjs(d).format('DD.MM.YYYY') : '-' },
        { title: 'Durum', dataIndex: 'status', key: 'status' }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Grup Çalışmaları</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Yeni Grup Ekle
                </Button>
            </div>

            <Table dataSource={groups} columns={columns} rowKey="id" />

            {/* ANALİZDEKİ FORM MODALI  */}
            <Modal
                title="Grup Çalışması Formu"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="groupName" label="Hangi Grup Çalışması" rules={[{ required: true }]}>
                        <Select placeholder="Seçiniz veya Yazınız" showSearch allowClear>
                            <Option value="Sosyal Beceri Grubu">Sosyal Beceri Grubu</Option>
                            <Option value="Anksiyete ile Baş Etme">Anksiyete ile Baş Etme</Option>
                            <Option value="Yas Süreci Grubu">Yas Süreci Grubu</Option>
                            <Option value="Grup Çalışması Önerilmedi">Grup Çalışması Önerilmedi</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="startDate" label="Grup Başlama Tarihi">
                        <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                    </Form.Item>

                    <Form.Item name="endDate" label="Grup Bitiş Tarihi">
                        <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                    </Form.Item>

                    <Form.Item name="sessionCount" label="Grup Oturum Sayısı">
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>

                    <Form.Item name="completionStatus" label="Bitiş Şekli">
                        <Select>
                            <Option value="Tamamlandı">Tamamlandı</Option>
                            <Option value="İptal Edildi">İptal Edildi</Option>
                            <Option value="Devam Ediyor">Devam Ediyor</Option>
                            <Option value="Cevap Yok">Cevap Yok</Option>
                        </Select>
                    </Form.Item>

                    <div className="text-right">
                        <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>İptal</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>Kaydet</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default GroupStudiesPage;