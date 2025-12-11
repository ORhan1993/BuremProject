// Dosya: src/pages/Admin/TherapistModule.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, Statistic, Tabs, Table, Tag, Space, Avatar, Badge, Button, Modal, Form, Select, DatePicker, InputNumber, message, Drawer, Typography, Descriptions } from 'antd';
import { ClockCircleOutlined, AlertOutlined, MedicineBoxOutlined, CalendarOutlined, HistoryOutlined, TeamOutlined, PlusOutlined, UserOutlined, RightOutlined } from '@ant-design/icons';
import agent from '../../api/agent'; 

const { Option } = Select;
const { Title, Text } = Typography;
const PRIMARY_COLOR = '#1e4a8b';
const SECONDARY_COLOR = '#8cc8ea';

const TherapistModule = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [studentDetail, setStudentDetail] = useState<any | null>(null);
    
    // CANLI VERİ İÇİN STATE
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // GRUP ÇALIŞMASI STATE'LERİ (Aynen korundu)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupForm] = Form.useForm();
    const [groups, setGroups] = useState([
        { id: 1, groupName: 'Sosyal Beceri Grubu', startDate: '01.12.2025', endDate: '01.02.2026', sessionCount: 8, status: 'Devam Ediyor' }
    ]);

    // CANLI VERİ ÇEKME İŞLEMİ
    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                // API'den gerçek veriyi çekiyoruz
                const data = await agent.Appointments.getMyAppointments();
                setAppointments(data || []);
            } catch (error) {
                console.error("Randevu hatası:", error);
                message.error("Randevularınız yüklenirken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handleOpenDrawer = async (appointment: any) => {
        setSelectedAppointment(appointment);
        setDrawerVisible(true);
        try {
            // Eğer backend studentId gönderiyorsa detay çek
            if(appointment.studentId) {
                const detail = await agent.Students.getById(Number(appointment.studentId)); 
                setStudentDetail(detail);
            } else {
                setStudentDetail({ firstName: appointment.studentName, studentNo: '---', department: '---' });
            }
        } catch { 
            message.warning("Öğrenci detayı yüklenemedi, temel bilgiler gösteriliyor.");
            setStudentDetail({ firstName: appointment.studentName, studentNo: '---', department: '---' });
        }
    };

    const handleSaveGroup = (values: any) => {
        const newGroup = {
            id: Date.now(),
            groupName: values.groupName,
            startDate: values.startDate ? values.startDate.format('DD.MM.YYYY') : '',
            endDate: values.endDate ? values.endDate.format('DD.MM.YYYY') : '',
            sessionCount: values.sessionCount,
            status: values.status
        };
        setGroups([...groups, newGroup]);
        message.success('Grup çalışması başarıyla oluşturuldu.');
        setIsGroupModalOpen(false);
        groupForm.resetFields();
    };

    const columns = [
        { title: 'Saat', dataIndex: 'time', width: 80, render: (t:any) => <Tag color="blue" style={{fontSize: 14}}>{t}</Tag> },
        { title: 'Danışan', dataIndex: 'studentName', render: (text: string, r: any) => (<Space><Avatar style={{backgroundColor: SECONDARY_COLOR}} icon={<UserOutlined />} /><div><div style={{fontWeight: 600, color: PRIMARY_COLOR}}>{text}</div><div style={{fontSize: '11px', color: '#888'}}>{r.studentId}</div></div></Space>) },
        { title: 'Görüşme Tipi', dataIndex: 'type', render: (t: string) => <Tag color={t === 'Online' ? 'purple' : 'geekblue'}>{t}</Tag> },
        { title: 'Notlar', dataIndex: 'note', ellipsis: true, render: (t:string) => <Text type="secondary" style={{fontSize:12}}>{t}</Text> },
        { title: 'Durum', dataIndex: 'status', render: (s: string) => <Badge status={s==='active'?'processing':'success'} text={s==='active'?'Bekleniyor':s} /> },
        { title: 'İşlem', render: (_: any, r: any) => (<Button type="primary" size="small" onClick={() => handleOpenDrawer(r)} style={{backgroundColor: PRIMARY_COLOR, borderRadius: 4}}>Dosyayı Aç <RightOutlined /></Button>) }
    ];

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            <Row gutter={[16, 16]} style={{marginBottom: 24}}>
                <Col span={18}>
                    <Alert message={<span style={{fontWeight:'bold', fontSize:16}}>Terapist Paneli</span>} description={`Bugün toplam ${appointments.length} randevunuz var.`} type="info" showIcon icon={<ClockCircleOutlined style={{fontSize: 24, color: PRIMARY_COLOR}}/>} style={{border: `1px solid ${SECONDARY_COLOR}`, backgroundColor: '#e6f7ff', height: '100%', display:'flex', alignItems:'center'}} />
                </Col>
                <Col span={6}>
                    <Card style={{marginBottom: 0, textAlign:'center', background: '#fff3f3', borderColor: '#ffa39e'}} styles={{ body: { padding: 24 } }}>
                        <Statistic title="Acil Durum" value={0} prefix={<AlertOutlined style={{color: 'red'}} />} valueStyle={{color: 'red', fontSize: 20}} />
                    </Card>
                </Col>
            </Row>

            <div style={{ backgroundColor: '#fff', borderLeft: `4px solid ${PRIMARY_COLOR}`, color: PRIMARY_COLOR, padding: '16px 20px', marginBottom: '24px', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', borderRadius: '0 8px 8px 0' }}>
                <MedicineBoxOutlined /> Randevu Takvimi & Dosyalar
            </div>

            <Card style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(30, 74, 139, 0.08)' }} styles={{ body: { padding: 0 } }}>
                <Tabs defaultActiveKey="1" type="card" size="large" tabBarStyle={{ margin: 0, padding: '10px 10px 0 10px', background: '#fafafa' }} items={[
                    { key: '1', label: <span><CalendarOutlined /> Bugünkü Program</span>, children: <Table dataSource={appointments} columns={columns} rowKey="id" pagination={false} style={{padding: 20}} loading={loading} /> },
                    { key: '2', label: <span><HistoryOutlined /> Geçmiş Görüşmeler</span>, children: <div style={{padding:20, textAlign:'center'}}>Geçmiş veriler API üzerinden yüklenecek...</div> },
                    {
                        key: '3',
                        label: <span><TeamOutlined /> Grup Çalışmaları</span>,
                        children: (
                            <div style={{padding: 20}}>
                                <div style={{marginBottom: 16, display: 'flex', justifyContent: 'flex-end'}}>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsGroupModalOpen(true)}>Yeni Grup Oluştur</Button>
                                </div>
                                <Table dataSource={groups} rowKey="id" columns={[{title:'Grup Adı', dataIndex:'groupName', render: (t:any) => <b>{t}</b>}, {title:'Başlangıç', dataIndex:'startDate'}, {title:'Durum', dataIndex:'status', render: (s:any) => <Badge status="processing" text={s} />}]} pagination={false} />
                            </div>
                        )
                    }
                ]} />
            </Card>

            <Drawer title="Danışan Dosyası" placement="right" width={850} onClose={() => setDrawerVisible(false)} open={drawerVisible}>
                {studentDetail ? (
                    <div>
                        <Title level={3}>{studentDetail.firstName} {studentDetail.lastName}</Title>
                        <Text strong style={{fontSize: 16}}>{studentDetail.studentNo}</Text>
                        <Descriptions bordered column={1} style={{marginTop: 20}}>
                            <Descriptions.Item label="Bölüm">{studentDetail.department}</Descriptions.Item>
                            <Descriptions.Item label="Telefon">{studentDetail.mobilePhone}</Descriptions.Item>
                            <Descriptions.Item label="Risk">{studentDetail.riskLevel || 'Belirtilmemiş'}</Descriptions.Item>
                        </Descriptions>
                    </div>
                ) : <p>Yükleniyor...</p>}
            </Drawer>

            <Modal title="Yeni Grup Çalışması" open={isGroupModalOpen} onCancel={() => setIsGroupModalOpen(false)} footer={null}>
                <Form form={groupForm} layout="vertical" onFinish={handleSaveGroup}>
                    <Form.Item name="groupName" label="Grup Adı" rules={[{required:true}]}><InputNumber style={{width:'100%'}} /></Form.Item>
                    <Form.Item name="startDate" label="Başlangıç Tarihi"><DatePicker style={{width:'100%'}} format="DD.MM.YYYY" /></Form.Item>
                    <Form.Item name="status" label="Durum"><Select><Option value="Planlanıyor">Planlanıyor</Option><Option value="Devam Ediyor">Devam Ediyor</Option></Select></Form.Item>
                    <div style={{textAlign:'right'}}><Button type="primary" htmlType="submit">Kaydet</Button></div>
                </Form>
            </Modal>
        </div>
    );
};
export default TherapistModule;