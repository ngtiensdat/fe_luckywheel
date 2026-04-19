import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Check, X, Trash2, Edit2, RotateCcw, User, Package, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]); // All gift requests
    const [dailyQuests, setDailyQuests] = useState([]); // All quest images
    const [searchUser, setSearchUser] = useState('');
    
    // Filter State
    const [selectedUser, setSelectedUser] = useState(null); // The full user object
    const [selectedQuestImage, setSelectedQuestImage] = useState(null);

    const fetchAll = async () => {
        try {
            const [u, r, q] = await Promise.all([
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/admin/users'),
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/admin/inventory/requests'),
                axios.get(import.meta.env.VITE_API_BASE_URL + '/api/quests/admin/pending')
            ]);
            setUsers(u.data);
            setRequests(r.data.filter(x => x.status === 'Đang chờ duyệt'));
            setDailyQuests(q.data);
        } catch(e) { console.error(e); }
    };

    useEffect(() => {
        if (localStorage.getItem('username') !== 'admin') navigate('/login');
        else fetchAll();
    }, []);

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
    
    // Dynamic lists for the selected user
    const userGifts = requests.filter(r => r.username === selectedUser?.username);
    const userQuests = dailyQuests.filter(q => q.user.username === selectedUser?.username);

    return (
        <div className="wheel-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div className="top-bar" style={{ position: 'relative', margin: '1rem', padding: '0 1rem' }}>
                <h2 style={{ color: '#fbbf24' }}>Quản Trị LuckyWheel</h2>
                <div className="spacer" />
                <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
                    <LogOut size={16} /> Đăng xuất
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '1rem', gap: '1rem' }}>
                {/* Left: Detail Panel for Selected User */}
                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="panel-header" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        {selectedUser ? (
                            <h3 style={{ margin: 0 }}>Duyệt cho: <span style={{ color: '#60a5fa' }}>{selectedUser.username}</span></h3>
                        ) : (
                            <h3 style={{ margin: 0, color: '#94a3b8' }}>Chọn một người để duyệt</h3>
                        )}
                    </div>
                    
                    <div className="panel-content" style={{ padding: '1rem', overflowY: 'auto' }}>
                        {!selectedUser && (
                            <div style={{ textAlign: 'center', marginTop: '5rem', color: '#475569' }}>
                                <User size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p>Hãy chọn một người dùng từ danh sách bên phải <br/> để xem yêu cầu của họ.</p>
                            </div>
                        )}

                        {selectedUser && (
                            <>
                                {/* Quà tặng */}
                                <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Package size={18} /> Quà tặng chờ duyệt ({userGifts.length})</h4>
                                {userGifts.map(g => (
                                    <div key={g.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>{g.itemName}</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => approveGift(g.id)} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>Duyệt</button>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ height: '1px', background: '#334155', margin: '20px 0' }} />

                                {/* Nhiệm vụ */}
                                <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Trophy size={18} /> Nhiệm vụ ảnh ({userQuests.length})</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                                    {userQuests.map(q => (
                                        <div key={q.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', textAlign: 'center' }}>
                                            <img 
                                                src={q.imageData} 
                                                onClick={() => setSelectedQuestImage(q.imageData)}
                                                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '5px', cursor: 'zoom-in' }} 
                                            />
                                            <div style={{ fontSize: '0.7rem', margin: '5px 0' }}>{q.questType}</div>
                                            <button onClick={() => approveQuest(q.id)} style={{ width: '100%', background: '#10b981', border: 'none', color: '#fff', padding: '2px', borderRadius: '4px', fontSize: '0.75rem' }}>Duyệt</button>
                                        </div>
                                    ))}
                                </div>
                                {userQuests.length === 0 && userGifts.length === 0 && <p style={{ textAlign: 'center', color: '#475569' }}>Người này không có yêu cầu nào.</p>}
                            </>
                        )}
                    </div>
                </div>

                {/* Right: User List */}
                <div className="glass-card" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Danh sách người chơi</h3>
                        <input 
                            type="text" 
                            placeholder="Tìm user..." 
                            value={searchUser}
                            onChange={e => setSearchUser(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', padding: '5px 10px', borderRadius: '6px' }}
                        />
                    </div>
                    <div className="panel-content" style={{ padding: '10px', overflowY: 'auto' }}>
                        {filteredUsers.map(u => {
                            const hasP = requests.some(r => r.username === u.username) || dailyQuests.some(q => q.user.username === u.username);
                            return (
                                <div 
                                    key={u.id} 
                                    onClick={() => setSelectedUser(u)}
                                    style={{ 
                                        padding: '12px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                                        background: selectedUser?.id === u.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: selectedUser?.id === u.id ? '1px solid #3b82f6' : '1px solid transparent',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lượt quay: {u.spins} | Năng lượng: {u.miniGamePoints}</div>
                                    </div>
                                    {hasP && <div style={{ background: '#ef4444', width: '10px', height: '10px', borderRadius: '50%' }} title="Có yêu cầu chờ duyệt" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lightbox forQuest Images */}
            {selectedQuestImage && (
                <div onClick={() => setSelectedQuestImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={selectedQuestImage} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '10px' }} />
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
