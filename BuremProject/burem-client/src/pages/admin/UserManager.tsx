import React, { useState } from 'react';
import { Card, Table, Button, Space, Popconfirm, Modal, Form } from 'antd';
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const UserManager = ({ title, data, columns, onAdd, onDelete, formFields, loading }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    
    const handleAddClick = () => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); };
    const handleEditClick = (record: any) => { setEditingItem(record); form.setFieldsValue(record); setIsModalOpen(true); };
    
    const handleSave = async (values: any) => { await onAdd(values, editingItem); setIsModalOpen(false); };
    
    const enhancedColumns = [...columns, { title: 'İşlem', key: 'action', width: 100, align:'center' as const, render: (_:any, r: any) => (<Space><Button size="small" icon={<EditOutlined />} onClick={() => handleEditClick(r)} /><Popconfirm title="Sil?" onConfirm={() => onDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space>) }];
    
    return (
        <Card title={<Space><TeamOutlined style={{color:'#1e4a8b'}}/> {title}</Space>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} style={{backgroundColor: '#1e4a8b'}}>Ekle</Button>}>
            <Table dataSource={data} columns={enhancedColumns} rowKey="id" scroll={{x: 600}} size="middle" loading={loading} />
            <Modal title={editingItem ? "Düzenle" : "Ekle"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={form.submit} destroyOnClose centered>
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{isActive: true}}>
                    {formFields}
                </Form>
            </Modal>
        </Card>
    );
};
export default UserManager;