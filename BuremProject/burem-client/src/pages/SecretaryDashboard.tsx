import React from 'react';
import { Layout } from 'antd';
import SecretaryModule from './admin/SecretaryModule';

const { Content } = Layout;

const SecretaryDashboard = () => {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            <Content style={{ margin: '24px' }}>
                <SecretaryModule />
            </Content>
        </Layout>
    );
};

export default SecretaryDashboard;