import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Check, X, Trash2, Edit2, RotateCcw, User, Package, Trophy, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]); 
    const [dailyQuests, setDailyQuests] = useState([]); 
    const [searchUser, setSearchUser] = useState('');
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedQuestImage, setSelectedQuestImage] = useState(null);
    const [editSpins, setEditSpins] = useState(0);

    const fetchAll = async () => {
        try {
            const [u, r, q] = await Promise.all([
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/users/admin/users'),
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/admin/inventory/requests'),
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/quests/admin/pending')
            ]);
            setUsers(u.data);
            setRequests(r.data.filter(x => x.status === 'Đang chờ duyệt'));
            setDailyQuests(q.data);
            
            if (selectedUser) {
                const updated = u.data.find(x => x.id === selectedUser.id);
                if (updated) setSelectedUser(updated);
            }
        } catch(e) { console.error("Lỗi lấy dữ liệu Admin:", e); }
    };

    useEffect(() => {
        if (localStorage.getItem('username') !== 'admin') navigate('/login');
        else {
            fetchAll();
            const interval = setInterval(fetchAll, 30000); // Tự động làm mới mỗi 30s
            return () => clearInterval(interval);
        }
    }, [navigate]);

    const updateSpins = async () => {
        if (!selectedUser) return;
        try {
            await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/users/${selectedUser.username}/spins`, { spins: editSpins });
            alert("Đã cập nhật lượt quay thành công!");
            await fetchAll();
        } catch(e) { alert("Lỗi cập nhật!"); }
    };

    const approveGift = async (id) => {
        try {
            await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/admin/inventory/${id}/approve`);
            fetchAll();
        } catch(e) { alert("Lỗi duyệt quà"); }
    };

    const approveQuest = async (id) => {
        try {
            await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/quests/admin/approve/${id}`);
            fetchAll();
        } catch(e) { alert("Lỗi duyệt ảnh"); }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()));
    const userGifts = requests.filter(r => r.username === selectedUser?.username);
    const userQuests = dailyQuests.filter(q => q.user.username === selectedUser?.username);

    return (
        <div className="admin-layout" style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 style={{ color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy /> BẢNG QUẢN TRỊ VIÊN</h2>
                <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <LogOut size={18} /> Thoát
                </button>
            </div>

            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Column 1: USER LIST (CHỌN NGƯỜI CHƠI) */}
                <div className="glass-card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>👥 Người chơi ({users.length})</h3>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Tìm tên người chơi..." 
                                value={searchUser}
                                onChange={e => setSearchUser(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 35px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {filteredUsers.map(u => {
                            const isPending = requests.some(r => r.username === u.username) || dailyQuests.some(q => q.user.username === u.username);
                            return (
                                <div 
                                    key={u.id} 
                                    onClick={() => { setSelectedUser(u); setEditSpins(u.spins); }}
                                    style={{ 
                                        padding: '12px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                                        background: selectedUser?.id === u.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: selectedUser?.id === u.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lượt: {u.spins} | Năng lượng: {u.miniGamePoints}</div>
                                    </div>
                                    {isPending && <div style={{ background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 10px #ef4444' }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 2: APPROVAL & EDITING (DUYỆT & SỬA) */}
                <div className="glass-card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <h3 style={{ margin: 0 }}>⚙️ {selectedUser ? `Quản lý: ${selectedUser.username}` : 'Chọn người dùng bên trái'}</h3>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                        {!selectedUser ? (
                            <div style={{ textAlign: 'center', marginTop: '5rem', color: '#475569' }}>
                                <User size={80} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>Hãy nhấn vào một người chơi <br/> để bắt đầu chỉnh sửa hoặc duyệt quà.</p>
                            </div>
                        ) : (
                            <>
                                {/* Sửa lượt quay */}
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.2rem', borderRadius: '12px', border: '1px solid #3b82f6', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: '0 0 12px 0' }}>Chỉnh sửa lượt quay</h4>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            value={editSpins}
                                            onChange={e => setEditSpins(parseInt(e.target.value) || 0)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '1.1rem' }}
                                        />
                                        <button onClick={updateSpins} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>LƯU</button>
                                    </div>
                                </div>

                                {/* Yêu cầu quà */}
                                <h4 style={{ color: '#10b981', marginBottom: '1rem' }}>🎁 Quà chờ duyệt ({userGifts.length})</h4>
                                {userGifts.map(g => (
                                    <div key={g.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <span style={{ fontWeight: '500' }}>{g.itemName}</span>
                                        <button onClick={() => approveGift(g.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Duyệt quà</button>
                                    </div>
                                ))}

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

                                {/* Ảnh nhiệm vụ */}
                                <h4 style={{ color: '#f59e0b', marginBottom: '1rem' }}>📸 Ảnh nhiệm vụ ({userQuests.length})</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                    {userQuests.map(q => (
                                        <div key={q.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img 
                                                src={q.imageData} 
                                                onClick={() => setSelectedQuestImage(q.imageData)}
                                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', marginBottom: '8px' }} 
                                            />
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>{q.questType === 'BREAKFAST' ? 'Sáng' : q.questType === 'LUNCH' ? 'Trưa' : 'Tối'}</div>
                                            <button onClick={() => approveQuest(q.id)} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Duyệt ảnh</button>
                                        </div>
                                    ))}
                                </div>
                                {userGifts.length === 0 && userQuests.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>Không có yêu cầu chờ xử lý.</p>}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {selectedQuestImage && (
                <div onClick={() => setSelectedQuestImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <img src={selectedQuestImage} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />
                    <div style={{ position: 'absolute', top: '20px', right: '20px', color: '#fff' }}><X size={40} /></div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
