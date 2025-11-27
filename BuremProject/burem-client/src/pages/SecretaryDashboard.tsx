import React, { useState } from 'react';
import { 
    Layout, Card, Calendar, Badge, List, Button, Modal, Form, 
    Select, DatePicker, Input, Row, Col, Tag, Typography, Tooltip, Table, Space
} from 'antd';
import { 
    UserAddOutlined, SearchOutlined, CalendarOutlined, 
    TeamOutlined, FilterOutlined, PlusOutlined 
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr'); // Türkçe takvim

const { Title, Text } = Typography;
const { Option } = Select;

// --- KURUMSAL KİMLİK ---
const PRIMARY_COLOR = '#1e4a8b'; 
const SECONDARY_COLOR = '#8cc8ea';
const BOUN_FONT = 'Helvetica, Arial, sans-serif';
const CARD_STYLE = { borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none', height: '100%' };

// --- MOCK DATA (Sekreter İçin) ---
const pendingStudents = [
    { id: 1, name: 'Canan Yıldız', department: 'Psikoloji', requestDate: '25.11.2025', urgency: 'Yüksek' },
    { id: 2, name: 'Burak Öz', department: 'İnşaat Müh.', requestDate: '24.11.2025', urgency: 'Normal' },
    { id: 3, name: 'Elif Su', department: 'Hazırlık', requestDate: '26.11.2025', urgency: 'Düşük' },
];

const therapistSchedule = [
    { date: '2025-11-26', type: 'warning', content: 'Ayşe Y. (10:00)' },
    { date: '2025-11-26', type: 'success', content: 'Mehmet Ö. (14:00)' },
    { date: '2025-11-27', type: 'warning', content: 'Ayşe Y. (11:00)' },
    { date: '2025-11-28', type: 'error', content: 'Tüm Dolu' },
];

const allAppointments = [
    { key: 1, student: 'Ali Yılmaz', therapist: 'Ayşe Yılmaz', date: '26.11.2025', time: '10:00', status: 'Onaylı' },
    { key: 2, student: 'Veli Can', therapist: 'Mehmet Öz', date: '26.11.2025', time: '14:00', status: 'Tamamlandı' },
    { key: 3, student: 'Selin K.', therapist: 'Ayşe Yılmaz', date: '27.11.2025', time: '09:00', status: 'Bekliyor' },
];

const SecretaryDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [form] = Form.useForm();

    // Takvim Hücre Render
    const dateCellRender = (value: Dayjs) => {
        const listData = therapistSchedule.filter(x => x.date === value.format('YYYY-MM-DD'));
        return (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {listData.map((item, index) => (
                    <li key={index}>
                        <Badge status={item.type as any} text={item.content} style={{fontSize: 10}} />
                    </li>
                ))}
            </ul>
        );
    };

    const handleCreateAppointment = (student: any) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            // --- ANALİZE UYGUN BACKEND PAYLOAD HAZIRLIĞI ---
            // Sekreter sadece 1. seansı atayabilir.
            const payload = {
                studentId: selectedStudent?.id,
                advisorId: values.therapist, 
                sessionDate: values.date.format('YYYY-MM-DD') + 'T' + values.time,
                isOnline: values.type === 'online',
                
                // --- KRİTİK İŞ KURALLARI ---
                sessionNumber: 1, // Sabit değer: İlk Görüşme
                status: 'Planlandı'
            };

            console.log("Backend'e gönderilen 1. Seans Kaydı:", payload);
            // Simülasyon: API çağrısı burada yapılacak (agent.Appointments.create(payload))
            
            // Başarılı kabul edip formu kapatıyoruz
            setIsModalOpen(false);
            form.resetFields();
        });
    };

    return (
        <div style={{ padding: 24, fontFamily: BOUN_FONT, background: '#f0f2f5', minHeight: '100vh' }}>
            
            {/* BAŞLIK */}
            <div style={{ marginBottom: 24, background: '#fff', padding: 16, borderRadius: 8, borderLeft: `4px solid ${PRIMARY_COLOR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={3} style={{ margin: 0, color: PRIMARY_COLOR, fontFamily: BOUN_FONT }}>Sekreter Paneli</Title>
                    <Text type="secondary">Randevu takvimi ve öğrenci bekleme listesi yönetimi.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" style={{backgroundColor: PRIMARY_COLOR}}>Hızlı Randevu</Button>
            </div>

            <Row gutter={[24, 24]}>
                {/* SOL KOLON: BEKLEYEN ÖĞRENCİ LİSTESİ (TALEP KUYRUĞU) */}
                <Col xs={24} lg={8}>
                    <Card 
                        title={<span style={{color: PRIMARY_COLOR}}><UserAddOutlined /> Bekleyen Başvurular</span>} 
                        style={CARD_STYLE}
                        extra={<Tag color="red">{pendingStudents.length} Bekleyen</Tag>}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={pendingStudents}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[<Button type="link" size="small" onClick={() => handleCreateAppointment(item)}>Randevu Ver</Button>]}
                                >
                                    <List.Item.Meta
                                        avatar={<div style={{width:40, height:40, background: SECONDARY_COLOR, borderRadius: '50%', display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontWeight:'bold'}}>{item.name.charAt(0)}</div>}
                                        title={<Text strong>{item.name}</Text>}
                                        description={
                                            <div>
                                                <div style={{fontSize: 12}}>{item.department}</div>
                                                <div style={{fontSize: 11, color: '#888'}}>Talep: {item.requestDate}</div>
                                                {/* Aciliyet bilgisi liste görünümünde kalabilir ama detayda gizlenecek */}
                                                {item.urgency === 'Yüksek' && <Tag color="red" style={{marginTop: 4}}>Acil</Tag>}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* SAĞ KOLON: TAKVİM GÖRÜNÜMÜ */}
                <Col xs={24} lg={16}>
                    <Card title={<span style={{color: PRIMARY_COLOR}}><CalendarOutlined /> Terapist Doluluk Takvimi</span>} style={CARD_STYLE}>
                        <Calendar dateCellRender={dateCellRender} fullscreen={false} />
                    </Card>
                </Col>
            </Row>

            {/* ALT PANEL: RANDEVU LİSTESİ TABLOSU */}
            <Row style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title={<span style={{color: PRIMARY_COLOR}}><TeamOutlined /> Tüm Randevu Listesi</span>} style={CARD_STYLE} extra={<Input prefix={<SearchOutlined/>} placeholder="Öğrenci veya Terapist Ara" style={{width: 200}} />}>
                        <Table 
                            dataSource={allAppointments}
                            pagination={{pageSize: 5}}
                            columns={[
                                { title: 'Öğrenci', dataIndex: 'student', key: 'student', render: (t) => <b>{t}</b> },
                                { title: 'Terapist', dataIndex: 'therapist', key: 'therapist' },
                                { title: 'Tarih', dataIndex: 'date', key: 'date' },
                                { title: 'Saat', dataIndex: 'time', key: 'time' },
                                { title: 'Durum', dataIndex: 'status', key: 'status', render: (t) => <Tag color={t==='Onaylı'?'green':(t==='Bekliyor'?'orange':'default')}>{t}</Tag> },
                                { title: 'İşlem', key: 'action', render: () => <Space><Button size="small">Düzenle</Button><Button size="small" danger>İptal</Button></Space> }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            {/* RANDEVU OLUŞTURMA MODALI - GÜNCELLENDİ */}
            <Modal
                title={<span style={{color: PRIMARY_COLOR}}>İlk Görüşme Ataması: {selectedStudent?.name}</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleOk}
                okText="Atamayı Yap ve Mail Gönder"
                cancelText="İptal"
                okButtonProps={{style: {backgroundColor: PRIMARY_COLOR}}}
            >
                <Form form={form} layout="vertical">
                    {/* İŞ AKIŞI UYARISI */}
                    <div style={{background: '#fff1f0', padding: 10, borderRadius: 6, marginBottom: 15, border: '1px solid #ffa39e'}}>
                        <Text type="danger" strong style={{fontSize: 12}}>⚠️ DİKKAT:</Text>
                        <Text style={{fontSize: 12, display: 'block', marginTop: 5}}>
                            Bu işlem öğrenci için sisteme <b>1. Seans</b> kaydını oluşturacak ve öğrenciye otomatik bilgilendirme e-postası gönderecektir.
                        </Text>
                    </div>

                    {/* KISITLANMIŞ ÖĞRENCİ BİLGİLERİ (KVKK GEREĞİ ÖLÇEKLER GİZLİ) */}
                    <div style={{background: '#f4f8fc', padding: 10, borderRadius: 6, marginBottom: 15}}>
                        <Text type="secondary" style={{fontSize: 12}}>Öğrenci Bilgileri:</Text>
                        <div><b>Bölüm:</b> {selectedStudent?.department}</div>
                        <div><b>Başvuru Tarihi:</b> {selectedStudent?.requestDate}</div>
                    </div>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="therapist" label="Terapist Seçimi" rules={[{required:true, message: 'Lütfen bir terapist seçin'}]}>
                                <Select placeholder="Seçiniz">
                                    <Option value="ayse">Ayşe Yılmaz (Kuzey)</Option>
                                    <Option value="mehmet">Mehmet Öz (Güney)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type" label="Görüşme Tipi" rules={[{required:true, message: 'Görüşme tipi seçiniz'}]}>
                                <Select placeholder="Seçiniz">
                                    <Option value="yuzyuze">Yüz Yüze</Option>
                                    <Option value="online">Online</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="date" label="Tarih" rules={[{required:true, message: 'Tarih seçiniz'}]}>
                                <DatePicker style={{width:'100%'}} format="DD.MM.YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="time" label="Saat" rules={[{required:true, message: 'Saat seçiniz'}]}>
                                <Select placeholder="Saat">
                                    <Option value="09:00">09:00</Option>
                                    <Option value="10:00">10:00</Option>
                                    <Option value="11:00">11:00</Option>
                                    <Option value="14:00">14:00</Option>
                                    <Option value="15:00">15:00</Option>
                                    <Option value="16:00">16:00</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="note" label="Sekreter Notu">
                        <Input.TextArea rows={2} placeholder="Terapist için özel not (Öğrenci görmez)..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SecretaryDashboard;