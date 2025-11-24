import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Card, Descriptions, Table, Tag, Button, Spin, Row, Col, Divider, Space, message, Tooltip } from 'antd';
import { 
    ArrowLeftOutlined, UserOutlined, BookOutlined, PhoneOutlined, TeamOutlined, 
    EditOutlined, FileTextOutlined, FileDoneOutlined, DownloadOutlined, LockOutlined 
} from '@ant-design/icons';
import agent from '../api/agent';
import type { StudentProfileDetail, StudentSession } from '../api/agent';

const { Header, Content } = Layout;

const StudentDetailPage = () => {
    const { id } = useParams(); // URL'den gelen öğrenci ID'si
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentProfileDetail | null>(null);

    useEffect(() => {
        if (id) {
            loadStudent(id);
        }
    }, [id]);

    const loadStudent = async (studentId: string | number) => {
        try {
            setLoading(true);
            // Backend'den öğrenci verisini çek (ID dönüşümleri backend'de yapılmış olarak gelir)
            const data = await agent.Students.getById(studentId);
            setStudent(data);
        } catch (error) {
            console.error(error);
            message.error("Öğrenci bilgileri alınamadı.");
        } finally {
            setLoading(false);
        }
    };

    // --- EXCEL İNDİRME İŞLEMİ ---
    const handleDownloadExcel = async (sessionId: number) => {
        if (!student) return;
        try {
            message.loading("Excel dosyası hazırlanıyor...", 1);
            // Backend'deki Export metodunu çağırır. 
            // Not: Tek bir başvuru için indiriyorsanız backend'e uygun parametre gönderilmeli.
            // Şimdilik tüm öğrenci verisini indiren genel metodu çağırıyoruz (Örnek).
            const response = await agent.Export.toExcel({ studentNo: student.studentNo });
            
            // Blob'dan dosya oluşturup indirt
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ogrenci_${student.studentNo}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            message.error("Excel indirme başarısız.");
        }
    };

    // --- BAŞVURU LİSTESİ TABLO KOLONLARI ---
    const sessionColumns = [
        { title: 'Başvuru No', dataIndex: 'id', key: 'id', width: 100 },
        { title: 'Tarih', dataIndex: 'sessionDate', key: 'sessionDate', width: 120 },
        { title: 'Danışman ID', dataIndex: 'advisorId', key: 'advisorId', width: 100 },
        { 
            title: 'Durum', 
            dataIndex: 'isArchived', 
            key: 'status',
            width: 100,
            render: (archived: boolean) => archived ? <Tag icon={<LockOutlined />} color="red">Arşivli</Tag> : <Tag color="green">Aktif</Tag>
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, r: StudentSession) => (
                <Space wrap>
                    {/* 1. GÖRÜNTÜLE BUTONU */}
                    <Tooltip title="Başvuru formunu görüntüle">
                        <Button 
                            type="primary" 
                            size="small" 
                            icon={<FileTextOutlined />} 
                            onClick={() => navigate(`/admin/session/view/${r.id}`)}
                        >
                            Göster
                        </Button>
                    </Tooltip>

                    {/* 2. DÜZENLE BUTONU (Sadece Arşivli Değilse) */}
                    {!r.isArchived && (
                        <Tooltip title="Başvuru formunu düzenle">
                            <Button 
                                size="small" 
                                style={{ borderColor: '#1890ff', color: '#1890ff' }} 
                                icon={<EditOutlined />} 
                                onClick={() => navigate(`/admin/session/edit/${r.id}`)}
                            >
                                Düzenle
                            </Button>
                        </Tooltip>
                    )}

                    {/* 3. DEĞERLENDİRME FORMU BUTONU */}
                    {r.hasFeedback ? (
                        <Tooltip title="Değerlendirme formunu görüntüle">
                            <Button 
                                danger 
                                size="small" 
                                icon={<FileDoneOutlined />}
                                onClick={() => message.info(`Değerlendirme Formu ID: ${r.feedbackSessionId}`)}
                            >
                                Değerlendirme
                            </Button>
                        </Tooltip>
                    ) : (
                         <Tooltip title="Henüz değerlendirme formu doldurulmamış">
                            <Button danger size="small" icon={<FileDoneOutlined />} disabled>Değerlendirme</Button>
                         </Tooltip>
                    )}

                    {/* 4. EXCEL BUTONU */}
                    <Tooltip title="Bu başvuruyu Excel olarak indir">
                        <Button 
                            size="small" 
                            icon={<DownloadOutlined />} 
                            style={{ background: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                            onClick={() => handleDownloadExcel(r.id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><Spin size="large" tip="Yükleniyor..." /></div>;
    
    if (!student) return (
        <div style={{padding:50, textAlign:'center'}}>
            <h3>Öğrenci Bulunamadı</h3>
            <Button onClick={() => navigate(-1)}>Geri Dön</Button>
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{ background: '#003366', padding: '0 24px', display:'flex', alignItems:'center' }}>
                <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: 'white', marginRight: 15, fontSize: 18 }} onClick={() => navigate('/admin/search')} />
                <span style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                    Öğrenci Detayı: {student.firstName} {student.lastName}
                </span>
            </Header>

            <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                <Row gutter={[24, 24]}>
                    
                    {/* --- SOL KOLON: PROFİL BİLGİLERİ --- */}
                    <Col xs={24} lg={9}>
                        <Card 
                            title={<><UserOutlined /> Kimlik & İletişim Bilgileri</>}
                            extra={<Button size="small" icon={<EditOutlined />}>Profil Düzenle</Button>}
                            bordered={false} 
                            style={{ borderRadius: 8, height: '100%' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', color: '#003366', fontWeight: 'bold' }}
                        >
                            <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width:'140px'}}>
                                <Descriptions.Item label="Öğrenci No">{student.studentNo}</Descriptions.Item>
                                <Descriptions.Item label="Ad Soyad">{student.firstName} {student.lastName}</Descriptions.Item>
                                <Descriptions.Item label="Cinsiyet">{student.gender}</Descriptions.Item>
                                <Descriptions.Item label="Doğum Yılı">{student.birthYear}</Descriptions.Item>
                                <Descriptions.Item label="Telefon">{student.mobilePhone}</Descriptions.Item>
                                <Descriptions.Item label="E-posta">{student.email}</Descriptions.Item>
                                <Descriptions.Item label="Yaşama Biçimi">{student.lifestyle}</Descriptions.Item>
                            </Descriptions>

                            <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 'bold', color: '#003366', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                                <PhoneOutlined /> İLETİŞİM KURULACAK KİŞİ
                            </div>
                            <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width:'140px'}}>
                                <Descriptions.Item label="Yakınlık">{student.contactDegree}</Descriptions.Item>
                                <Descriptions.Item label="Adı">{student.contactPerson}</Descriptions.Item>
                                <Descriptions.Item label="Telefon">{student.contactPhone}</Descriptions.Item>
                            </Descriptions>
                            
                            <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 'bold', color: '#003366', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                                <TeamOutlined /> AİLE BİLGİLERİ
                            </div>
                            <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width:'140px'}}>
                                <Descriptions.Item label="Anne Durumu">{student.isMotherAlive}</Descriptions.Item>
                                <Descriptions.Item label="Baba Durumu">{student.isFatherAlive}</Descriptions.Item>
                                <Descriptions.Item label="Birliktelik">{student.parentMarriage}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* --- SAĞ KOLON: AKADEMİK VE BAŞVURULAR --- */}
                    <Col xs={24} lg={15}>
                        {/* Akademik Bilgiler */}
                        <Card 
                            title={<><BookOutlined /> Akademik Bilgiler</>} 
                            bordered={false} 
                            style={{ borderRadius: 8, marginBottom: 24 }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', color: '#003366', fontWeight: 'bold' }}
                        >
                             <Descriptions column={1} bordered size="small" labelStyle={{fontWeight:'bold', width:'140px'}}>
                                <Descriptions.Item label="Fakülte">{student.faculty}</Descriptions.Item>
                                <Descriptions.Item label="Bölüm">{student.department}</Descriptions.Item>
                                <Descriptions.Item label="Dönem">{student.semester}</Descriptions.Item>
                                <Descriptions.Item label="Akademik Düzey">{student.academicLevel}</Descriptions.Item>
                                <Descriptions.Item label="Burs Durumu">{student.isScholar}</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Başvuru Listesi */}
                        <Card 
                            title="Geçmiş Başvurular / Seanslar" 
                            extra={<Button type="primary" size="small" icon={<FileTextOutlined />}>Yeni Başvuru Ekle</Button>}
                            bordered={false} 
                            style={{ borderRadius: 8 }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0', color: '#003366', fontWeight: 'bold' }}
                        >
                            <Table 
                                dataSource={student.sessions} 
                                columns={sessionColumns} 
                                rowKey="id" 
                                pagination={false}
                                size="middle"
                                bordered
                                locale={{emptyText: 'Kayıtlı başvuru bulunamadı.'}}
                            />
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default StudentDetailPage;