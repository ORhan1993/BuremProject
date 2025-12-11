// Dosya: src/pages/Admin/SecretaryModule.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, List, Button, Tag, Calendar, Badge, Popover, Typography, message } from 'antd';
import { CalendarOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import agent from '../../api/agent';
import AppointmentModal from '../../components/AppointmentModal'; 

const { Text } = Typography;
const PRIMARY_COLOR = '#1e4a8b';
const SECONDARY_COLOR = '#8cc8ea';
const cardStyle = { borderRadius: 8, boxShadow: '0 4px 12px rgba(30, 74, 139, 0.08)', border: '1px solid #dcebf7' };

const SecretaryModule = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentName, setSelectedStudentName] = useState('');
    
    // CANLI VERİ İÇİN STATE
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // API'den bekleyen öğrencileri çek
                const pendingData = await agent.Sessions.getPending();
                setPendingStudents(pendingData || []);

                // Eğer backend hazırsa takvim verisini de çekin
                // const scheduleData = await agent.Appointments.getSchedule();
                // setSchedule(scheduleData);
            } catch (error) {
                console.error(error);
                message.error("Bekleyen başvurular çekilemedi.");
            }
        };
        loadData();
    }, []);

    const cellRender = (value: dayjs.Dayjs, info: any) => {
        if (info.type === 'date') {
            const listData = schedule.filter(x => x.date === value.format('YYYY-MM-DD'));
            return (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {listData.map((item, index) => (
                        <li key={index}>
                            <Popover title={<span style={{color: PRIMARY_COLOR}}>{item.content}</span>} content={item.note}>
                                <Badge status={item.type} text={item.content} style={{ fontSize: 10 }} />
                            </Popover>
                        </li>
                    ))}
                </ul>
            );
        }
        return info.originNode;
    };

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            <div style={{ backgroundColor: '#fff', borderLeft: `4px solid ${PRIMARY_COLOR}`, color: PRIMARY_COLOR, padding: '16px 20px', marginBottom: '24px', fontSize: '18px', fontWeight: 700 }}>
                <CalendarOutlined style={{ marginRight: 10 }} /> Sekreter Randevu Yönetimi
            </div>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card title={<span style={{ color: PRIMARY_COLOR }}><UserAddOutlined /> Bekleyen Başvurular</span>} style={cardStyle} extra={<Tag color="red">{pendingStudents.length}</Tag>}>
                        <List 
                            itemLayout="horizontal" 
                            dataSource={pendingStudents} 
                            renderItem={(item) => (
                                <List.Item actions={[
                                    <Button 
                                        type="primary" 
                                        size="small" 
                                        onClick={() => { 
                                            // --- DEBUG LOGLARI BURADA ---
                                            console.log("🟢 BUTONA BASILDI!"); 
                                            console.log("Seçilen Öğrenci:", item.name); 
                                            
                                            setSelectedStudentName(item.name); 
                                            setIsModalOpen(true); 
                                        }} 
                                        style={{backgroundColor: SECONDARY_COLOR, borderColor: SECONDARY_COLOR}}
                                    >
                                        Randevu Ver
                                    </Button>
                                ]}>
                                    <List.Item.Meta
                                        avatar={<div style={{ width: 36, height: 36, background: '#8cc8ea', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>{item.name ? item.name.charAt(0) : '?'}</div>}
                                        title={<Text strong>{item.name}</Text>}
                                        description={<div><div style={{ fontSize: 11 }}>{item.department}</div><div style={{ fontSize: 10, color: '#888' }}>{dayjs(item.requestDate).format('DD.MM.YYYY')}</div></div>}
                                    />
                                </List.Item>
                            )} 
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title={<span style={{ color: PRIMARY_COLOR }}><CalendarOutlined /> Terapist Doluluk Takvimi</span>} style={cardStyle}>
                        <Calendar cellRender={cellRender} fullscreen={false} />
                    </Card>
                </Col>
            </Row>

            {/* DEBUG İÇİN EKRAN GÖSTERGESİ */}
            <div style={{ marginTop: 20, padding: 10, border: '1px dashed red', color: 'red', textAlign: 'center' }}>
                DEBUG: MODAL DURUMU = <b>{isModalOpen ? "AÇIK (TRUE)" : "KAPALI (FALSE)"}</b>
            </div>

            {/* Modal Çağrısı - Hem visible hem open eklendi */}
            <AppointmentModal 
                visible={isModalOpen} // Ant Design v4
                // @ts-ignore (Antd versiyonuna göre hata verirse yoksayması için)
                open={isModalOpen}    // Ant Design v5
                onCancel={() => { 
                    console.log("🔴 Modal Kapatıldı");
                    setIsModalOpen(false); 
                }} 
                studentName={selectedStudentName} 
                sessionId={0} // Gerçek veride buraya item.id gelmeli
            />
        </div>
    );
};

export default SecretaryModule;