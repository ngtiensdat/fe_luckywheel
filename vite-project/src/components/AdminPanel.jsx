import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Check, X, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  const [editUser, setEditUser] = useState(null);
  const [newSpins, setNewSpins] = useState(0);

  // New user state
  const [newUser, setNewUser] = useState({ username: '', password: '', spins: 0 });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + '/api/admin/users');
      setUsers(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + '/api/admin/inventory/requests');
      setRequests(res.data.filter(r => r.status === 'Đang chờ duyệt'));
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (localStorage.getItem('username') !== 'admin') {
      navigate('/login');
    } else {
      fetchUsers();
      fetchRequests();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const deleteUser = async (id) => {
    if(window.confirm('Chắc chắn xóa người dùng này?')) {
      try {
        await axios.delete(`http://localhost:8080/api/admin/users/${id}`);
        fetchUsers();
      } catch(e) { alert('Lỗi xóa'); }
    }
  };

  const updateSpins = async (id, currentSpins) => {
    try {
      const u = users.find(x => x.id === id);
      await axios.put(`http://localhost:8080/api/admin/users/${id}`, {
        ...u,
        spins: newSpins
      });
      setEditUser(null);
      fetchUsers();
    } catch(e) { alert('Lỗi cập nhật'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + '/api/admin/users', newUser);
      setNewUser({ username: '', password: '', spins: 0 });
      setShowAddForm(false);
      fetchUsers();
    } catch(e) { alert('Lỗi tạo mới'); }
  };

  const approveRequest = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/admin/inventory/${id}/approve`);
      fetchRequests();
    } catch(e) { alert('Lỗi duyệt'); }
  }

  const rejectRequest = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/admin/inventory/${id}/reject`);
      fetchRequests();
    } catch(e) { alert('Lỗi từ chối'); }
  }

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()));

  return (
    <div className="wheel-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto 2rem auto' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Admin Panel
        </h1>
        <button className="logout-btn" onClick={handleLogout} style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto', flexWrap: 'wrap' }}>
        
        {/* --- YÊU CẦU DUYỆT --- */}
        <div className="glass-card" style={{ flex: '1', minWidth: '300px', padding: '1.5rem', alignSelf: 'flex-start' }}>
          <h2 style={{ color: '#10b981', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            📦 Yêu cầu duyệt quà ({requests.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {requests.map(req => (
              <div key={req.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#60a5fa' }}>{req.username}</strong>
                  <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Đang chờ</span>
                </div>
                <div style={{ color: '#fff' }}>Vật phẩm: {req.itemName}</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button onClick={() => approveRequest(req.id)} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                    <Check size={16} /> Duyệt
                  </button>
                  <button onClick={() => rejectRequest(req.id)} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                    <X size={16} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center' }}>Không có yêu cầu nào.</div>}
          </div>
        </div>

        {/* --- QUẢN LÝ NGƯỜI DÙNG --- */}
        <div className="glass-card" style={{ flex: '2', minWidth: '350px', padding: '1.5rem', alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <h2 style={{ color: '#a78bfa', margin: 0 }}>👥 Người chơi ({users.length})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Tìm user..." 
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', padding: '5px 10px', borderRadius: '6px', outline: 'none' }}
              />
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {showAddForm ? 'Hủy' : '+ Thêm'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={createUser} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa' }}>Thêm tài khoản cấp phép</h3>
              <input type="text" required placeholder="Tên đăng nhập" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} style={inputStyle} />
              <input type="password" required placeholder="Mật khẩu" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} style={inputStyle} />
              <input type="number" required placeholder="Số lượt quay ban đầu" value={newUser.spins} onChange={e=>setNewUser({...newUser, spins: Number(e.target.value)})} style={inputStyle} />
              <button type="submit" style={{ background: '#10b981', color: '#fff', padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Tạo tài khoản mới
              </button>
            </form>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredUsers.map(u => (
              <div key={u.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.username}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Lượt quay: 
                    {editUser === u.id ? (
                      <input type="number" value={newSpins} onChange={e=>setNewSpins(e.target.value)} style={{ width: '50px', marginLeft: '5px', background: 'transparent', color: '#fff', border: '1px solid #60a5fa', padding: '2px 5px', borderRadius: '4px' }} />
                    ) : (
                      <strong style={{ color: '#60a5fa', marginLeft: '5px' }}>{u.spins}</strong>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  {editUser === u.id ? (
                    <button onClick={() => updateSpins(u.id, u.spins)} style={{ background: '#10b981', ...btnStyle }}><Check size={16} /></button>
                  ) : (
                    <button onClick={() => { setEditUser(u.id); setNewSpins(u.spins); }} style={{ background: '#3b82f6', ...btnStyle }}><Edit2 size={16} /></button>
                  )}
                  <button onClick={() => deleteUser(u.id)} style={{ background: '#ef4444', ...btnStyle }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const btnStyle = {
  color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'
}

const inputStyle = {
  background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none'
}

export default AdminPanel;
