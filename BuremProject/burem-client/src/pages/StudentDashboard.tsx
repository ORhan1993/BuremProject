import React from 'react';
import { Layout, Card, Tabs, List, Tag, Calendar, Badge, Typography, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

const StudentDashboard = () => {
    const activeApplications = [
        { id: 1, date: '20.11.2025', status: 'İşlemde', type: 'Bireysel Görüşme' },
    ];

    const appointments = [
        { type: 'warning', content: '14:00 Görüşme', date: dayjs().format('YYYY-MM-DD') },
    ];

    const cellRender = (value: dayjs.Dayjs) => {
        const listData = appointments.filter(x => x.date === value.format('YYYY-MM-DD'));
        return (
            <ul style={{padding:0, listStyle:'none'}}>
                {listData.map((item, index) => (
                    <li key={index}><Badge status={item.type as any} text={item.content} /></li>
                ))}
            </ul>
        );
    };

    // AntD v5 Tabs formatı
    const tabItems = [
        {
            key: '1',
            label: 'Başvurularım',
            children: (
                <List
                    dataSource={activeApplications}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                title={`Başvuru #${item.id}`}
                                description={item.type}
                            />
                            <div style={{textAlign:'right'}}>
                                <div>{item.date}</div>
                                <Tag color="processing">{item.status}</Tag>
                            </div>
                        </List.Item>
                    )}
                />
            )
        },
        {
            key: '2',
            label: 'Randevularım',
            children: <div style={{padding:10}}><Calendar fullscreen={false} cellRender={cellRender} /></div>
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3} style={{ color: '#1e4a8b' }}>Öğrenci Paneli</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Aktif Başvuru" value={1} prefix={<FileTextOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Tamamlanan Seans" value={3} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Sıradaki Randevu" value="Bugün 14:00" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#cf1322', fontSize: 18 }} />
                    </Card>
                </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
                {/* Card bodyStyle düzeltmesi: styles.body */}
                <Card styles={{ body: { padding: 0 } }}>
                    <Tabs defaultActiveKey="1" items={tabItems} tabBarStyle={{padding: '0 20px'}} />
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;