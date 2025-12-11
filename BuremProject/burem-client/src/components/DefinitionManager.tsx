import React, { useState, useEffect } from 'react';
import agent from '../api/agent';
import { DefinitionItem, RoleItem, CustomHolidayItem } from '../models/Definitions';

interface Props {
    userRole: number; // 1: Admin, 2: Sekreter
}

export default function DefinitionManager({ userRole }: Props) {
    // --- LİSTE STATE'LERİ ---
    const [campuses, setCampuses] = useState<DefinitionItem[]>([]);
    const [types, setTypes] = useState<DefinitionItem[]>([]);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [holidays, setHolidays] = useState<CustomHolidayItem[]>([]);

    // --- FORM STATE'LERİ ---
    const [newCampus, setNewCampus] = useState("");
    const [newType, setNewType] = useState("");
    const [newRole, setNewRole] = useState("");
    const [holidayDate, setHolidayDate] = useState("");
    const [holidayDesc, setHolidayDesc] = useState("");

    // --- DÜZENLEME STATE'İ ---
    const [editMode, setEditMode] = useState<{ type: string, id: number } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Verileri Yükle
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Herkesin görebileceği veriler
            const typesRes = await agent.Definitions.listTherapistTypes();
            const holidaysRes = await agent.Definitions.listHolidays();
            setTypes(typesRes);
            setHolidays(holidaysRes);

            // Sadece Admin (1) görebileceği veriler
            if (userRole === 1) {
                const campusRes = await agent.Definitions.listCampuses();
                const rolesRes = await agent.Definitions.listRoles();
                setCampuses(campusRes);
                setRoles(rolesRes);
            }
        } catch (error) {
            console.error("Veri yükleme hatası", error);
        }
    };

    // --- EKLEME İŞLEMLERİ ---
    const handleCreate = async (type: 'campus' | 'type' | 'role' | 'holiday') => {
        try {
            let res;
            if (type === 'campus') {
                if (!newCampus) return;
                res = await agent.Definitions.createCampus({ name: newCampus });
                setNewCampus("");
            } else if (type === 'type') {
                if (!newType) return;
                res = await agent.Definitions.createTherapistType({ name: newType });
                setNewType("");
            } else if (type === 'role') {
                if (!newRole) return;
                res = await agent.Definitions.createRole({ roleName: newRole });
                setNewRole("");
            } else if (type === 'holiday') {
                if (!holidayDate) return;
                res = await agent.Definitions.createHoliday({ 
                    date: holidayDate, 
                    description: holidayDesc, 
                    currentUserRoleId: userRole 
                });
                setHolidayDate(""); setHolidayDesc("");
            }

            if (res?.isSuccess) {
                loadData();
                alert("Kayıt başarılı.");
            } else {
                alert(res?.message || "İşlem başarısız.");
            }
        } catch (error) { alert("Hata oluştu."); }
    };

    // --- SİLME İŞLEMLERİ ---
    const handleDelete = async (type: 'campus' | 'type' | 'role' | 'holiday', id: number) => {
        if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            let res;
            if (type === 'campus') res = await agent.Definitions.deleteCampus(id);
            else if (type === 'type') res = await agent.Definitions.deleteTherapistType(id);
            else if (type === 'role') res = await agent.Definitions.deleteRole(id);
            else if (type === 'holiday') res = await agent.Definitions.deleteHoliday(id);

            if (res?.isSuccess) loadData();
            else alert(res?.message || "Silinemedi (Kullanımda olabilir).");
        } catch (error) { alert("Hata oluştu."); }
    };

    // --- GÜNCELLEME İŞLEMLERİ ---
    const startEdit = (type: string, id: number, currentVal: string) => {
        setEditMode({ type, id });
        setEditValue(currentVal);
    };

    const saveEdit = async () => {
        if (!editMode) return;
        try {
            let res;
            if (editMode.type === 'campus') 
                res = await agent.Definitions.updateCampus({ id: editMode.id, name: editValue });
            else if (editMode.type === 'type') 
                res = await agent.Definitions.updateTherapistType({ id: editMode.id, name: editValue });
            else if (editMode.type === 'role') 
                res = await agent.Definitions.updateRole({ id: editMode.id, roleName: editValue });

            if (res?.isSuccess) {
                setEditMode(null);
                loadData();
            } else {
                alert(res?.message || "Güncelleme başarısız.");
            }
        } catch (error) { alert("Hata oluştu."); }
    };

    // --- ORTAK LİSTE RENDER ---
    const renderList = (items: any[], type: 'campus' | 'type' | 'role') => (
        <ul className="divide-y max-h-40 overflow-y-auto text-sm mt-2 border rounded">
            {items.map(item => {
                const isEditing = editMode?.type === type && editMode?.id === item.id;
                const displayText = type === 'role' ? item.roleName : item.name;

                return (
                    <li key={item.id} className="p-2 flex justify-between items-center hover:bg-gray-50 group">
                        {isEditing ? (
                            <div className="flex gap-1 flex-1 mr-2">
                                <input 
                                    className="border p-1 rounded flex-1 text-xs" 
                                    value={editValue} 
                                    onChange={e => setEditValue(e.target.value)} 
                                />
                                <button onClick={saveEdit} className="text-green-600 font-bold px-1">✓</button>
                                <button onClick={() => setEditMode(null)} className="text-gray-500 font-bold px-1">✕</button>
                            </div>
                        ) : (
                            <span className="flex-1">{displayText}</span>
                        )}

                        {!isEditing && (
                            <div className="hidden group-hover:flex gap-2">
                                <button onClick={() => startEdit(type, item.id, displayText)} className="text-blue-500 text-xs underline">Düzelt</button>
                                <button onClick={() => handleDelete(type, item.id)} className="text-red-500 text-xs underline">Sil</button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            
            {/* 1. KAMPÜS YÖNETİMİ (Sadece Admin) */}
            {userRole === 1 && (
                <div className="bg-white p-4 shadow rounded border-t-4 border-blue-600">
                    <h3 className="font-bold text-gray-700 mb-2">Kampüsler</h3>
                    <div className="flex gap-2">
                        <input className="border p-1 flex-1 rounded text-sm" placeholder="Yeni Kampüs" value={newCampus} onChange={e => setNewCampus(e.target.value)} />
                        <button onClick={() => handleCreate('campus')} className="bg-blue-600 text-white px-3 rounded text-sm">Ekle</button>
                    </div>
                    {renderList(campuses, 'campus')}
                </div>
            )}

            {/* 2. ROL YÖNETİMİ (Sadece Admin) */}
            {userRole === 1 && (
                <div className="bg-white p-4 shadow rounded border-t-4 border-gray-600">
                    <h3 className="font-bold text-gray-700 mb-2">Roller</h3>
                    <div className="flex gap-2">
                        <input className="border p-1 flex-1 rounded text-sm" placeholder="Yeni Rol" value={newRole} onChange={e => setNewRole(e.target.value)} />
                        <button onClick={() => handleCreate('role')} className="bg-gray-600 text-white px-3 rounded text-sm">Ekle</button>
                    </div>
                    {renderList(roles, 'role')}
                </div>
            )}

            {/* 3. UZMAN TİPİ (Herkes) */}
            <div className="bg-white p-4 shadow rounded border-t-4 border-purple-600">
                <h3 className="font-bold text-gray-700 mb-2">Uzman Tipleri</h3>
                <div className="flex gap-2">
                    <input className="border p-1 flex-1 rounded text-sm" placeholder="Örn: Deneyimli" value={newType} onChange={e => setNewType(e.target.value)} />
                    <button onClick={() => handleCreate('type')} className="bg-purple-600 text-white px-3 rounded text-sm">Ekle</button>
                </div>
                {renderList(types, 'type')}
            </div>

            {/* 4. RESMİ TATİL (Herkes) */}
            <div className="bg-white p-4 shadow rounded border-t-4 border-red-600">
                <h3 className="font-bold text-gray-700 mb-2">Özel Tatiller</h3>
                <div className="flex flex-col gap-2 mb-2">
                    <input type="date" className="border p-1 rounded text-sm" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} />
                    <div className="flex gap-2">
                        <input className="border p-1 flex-1 rounded text-sm" placeholder="Açıklama" value={holidayDesc} onChange={e => setHolidayDesc(e.target.value)} />
                        <button onClick={() => handleCreate('holiday')} className="bg-red-600 text-white px-3 rounded text-sm">Ekle</button>
                    </div>
                </div>
                <ul className="divide-y max-h-40 overflow-y-auto text-sm mt-2 border rounded">
                    {holidays.map(h => (
                        <li key={h.id} className="p-2 flex justify-between items-center hover:bg-gray-50 group">
                            <span>
                                <span className="font-bold text-red-600 mr-2">{new Date(h.holidayDate).toLocaleDateString()}</span>
                                {h.description}
                            </span>
                            <button onClick={() => handleDelete('holiday', h.id)} className="text-red-500 text-xs underline hidden group-hover:block">Sil</button>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
}