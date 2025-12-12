import React from 'react';
import { Layout } from 'antd';
import TherapistModule from './admin/TherapistModule';

const { Content } = Layout;

const TherapistDashboard = () => {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            <Content style={{ margin: '24px' }}>
                <TherapistModule />
            </Content>
        </Layout>
    );
};

export default TherapistDashboard;