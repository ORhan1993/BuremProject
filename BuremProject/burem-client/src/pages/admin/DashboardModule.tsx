import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Title, Spin } from 'antd';
import { FileTextOutlined, TeamOutlined, CheckCircleOutlined, AlertOutlined } from '@ant-design/icons';
import agent from '../../api/agent';

const DashboardModule = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // CANLI VERİ
                const data = await agent.Stats.getDashboard();
                setStats(data);
            } catch (error) {
                console.error("İstatistik hatası", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <Spin size="large" />;

    return (
        <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Card><Statistic title="Toplam Başvuru" value={stats?.totalStudents || 0} prefix={<FileTextOutlined />} valueStyle={{ color: '#3f8600' }} /><Progress percent={70} showInfo={false} strokeColor="#3f8600" size="small" /></Card></Col>
                <Col span={6}><Card><Statistic title="Aktif Görüşmeler" value={stats?.activeCases || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /><Progress percent={45} showInfo={false} strokeColor="#1890ff" size="small" /></Card></Col>
                <Col span={6}><Card><Statistic title="Tamamlanan" value={stats?.completedProcess || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#722ed1' }} /><Progress percent={100} showInfo={false} strokeColor="#722ed1" size="small" /></Card></Col>
                <Col span={6}><Card style={{ background: '#fff1f0' }}><Statistic title="Riskli Vaka" value={stats?.riskCases || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
            </Row>
            {/* Grafikler vs burada kalabilir */}
        </div>
    );
};
export default DashboardModule;