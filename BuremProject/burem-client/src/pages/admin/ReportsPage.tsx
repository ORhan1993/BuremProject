import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';
import agent from '../../api/agent';
import { IDashboardStats } from '../../models/Reports';

const ReportsPage = () => {
    const [stats, setStats] = useState<IDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        agent.Reports.getDashboard()
            .then((res: any) => {
                setStats(res); // API'den gelen veriyi state'e at
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center">İstatistikler yükleniyor...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Veri alınamadı.</div>;

    // Pasta Grafik Verisi (Durumlar)
    const pieData = [
        { name: 'Tamamlanan', value: stats.completedCount },
        { name: 'Gelmedi (No-Show)', value: stats.noShowCount },
        { name: 'İptal', value: stats.cancelledCount },
        { name: 'Planlanan', value: stats.totalAppointments - (stats.completedCount + stats.noShowCount + stats.cancelledCount) }
    ];
    
    // BÜREM Kurumsal Renkleri (Mavi/Turuncu tonları)
    const COLORS = ['#00C49F', '#FF8042', '#FF0000', '#0088FE'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">BÜREM Yönetim Raporları</h1>

            {/* ÖZET KARTLAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase">Toplam Randevu</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalAppointments}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase">No-Show Oranı</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">%{stats.noShowRate}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase">Tamamlanan</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GRAFİK 1: RANDEVU DURUMLARI */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 text-center">Randevu Akıbet Dağılımı</h3>
                    <div className="h-80 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRAFİK 2: TERAPİST KATEGORİSİ */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 text-center">Uzman Türüne Göre Görüşme Yükü</h3>
                    <div className="h-80 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.therapistStats}>
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Randevu Sayısı" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;