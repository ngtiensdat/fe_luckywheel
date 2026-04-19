import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Gift, Clock, LogOut, X, Volume2, VolumeX, Camera, Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlotMachineModal from './SlotMachineModal';
import MiniGameModal from './MiniGameModal';
import ChestModal from './ChestModal';

const SOUNDS = {
  spin: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
};

const LuckyWheel = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [records, setRecords] = useState([]);
  const [miniPoints, setMiniPoints] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Modal states
  const [showInventory, setShowInventory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [isSlotMachineOpen, setIsSlotMachineOpen] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [chestsCount, setChestsCount] = useState(0);
  const [isPractice, setIsPractice] = useState(false);

  // New states for Quest & Checkin
  const [checkInInfo, setCheckInInfo] = useState(null);
  const [dailyStatus, setDailyStatus] = useState([]);
  const [activeQuestType, setActiveQuestType] = useState(null);
  const [questImage, setQuestImage] = useState(null);
  const [questNote, setQuestNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!username) navigate('/login');
    else fetchData();
  }, [username]);

  const fetchData = async () => {
    try {
      const [u, inv, hist, rec, ci, ds] = await Promise.all([
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/users/${username}`),
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/inventory/${username}`),
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/history/${username}`),
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/records/${username}`),
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/status/${username}`),
        axios.get(import.meta.env.VITE_API_BASE_URL + `/api/quests/daily-status/${username}`)
      ]);
      setSpinsLeft(u.data.spins);
      setMiniPoints(u.data.miniGamePoints || 0);
      setInventory(inv.data);
      setHistory(hist.data);
      setRecords(rec.data);
      setCheckInInfo(ci.data);
      setDailyStatus(ds.data);
    } catch (e) {}
  };

  const spinWheel = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    setIsSpinning(true); setPrize(null);
    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/spin/${username}`);
      const data = res.data;
      const sliceAngle = 360 / 10;
      const targetAngle = 360 - (data.index * sliceAngle + sliceAngle / 2);
      setRotation(prev => prev + (360 * 8) + targetAngle - (prev % 360));
      setSpinsLeft(data.spinsLeft);
      setPrize(data.prize);
      if(!isMuted) new Audio(SOUNDS.spin).play();
      fetchData();
    } catch (err) { setIsSpinning(false); }
    setTimeout(() => { 
        setIsSpinning(false); 
        if(!isMuted) new Audio(SOUNDS.win).play(); 
    }, 4200);
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/${username}`);
      alert("Điểm danh thành công!");
      fetchData();
    } catch(e) { alert(e.response?.data || "Lỗi điểm danh"); }
  };

  const submitQuest = async () => {
    if (!questImage) return alert("Vui lòng chụp ảnh!");
    setIsSubmitting(true);
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/submit/${username}`, {
        questType: activeQuestType, imageData: questImage, note: questNote
      });
      alert("Gửi thành công! Chờ Admin duyệt nhé.");
      setActiveQuestType(null); setQuestImage(null); setQuestNote("");
      fetchData();
    } catch(e) { alert(e.response?.data || "Lỗi nộp bài"); }
    finally { setIsSubmitting(false); }
  };

  const getStatusFor = (type) => {
    const quest = dailyStatus.find(q => q.questType === type);
    if (quest) return quest.status;
    const hour = new Date().getHours();
    if (type === 'BREAKFAST' && hour >= 6 && hour < 10) return 'AVAILABLE';
    if (type === 'LUNCH' && hour >= 12 && hour < 14) return 'AVAILABLE';
    if (type === 'DINNER' && hour >= 17 && hour < 21) return 'AVAILABLE';
    return 'LOCKED';
  };

  const prizes = [
    { text: '½ Stabuck', color: '#f87171' }, { text: '½ gội đầu', color: '#fb923c' },
    { text: 'Slot Machine', color: '#1e3a8a' }, { text: '½ gội đầu m.nạ', color: '#34d399' },
    { text: '½ massage mặt', color: '#60a5fa' }, { text: '½ voucher 100k', color: '#818cf8' },
    { text: '+ 2 lượt quay', color: '#a78bfa' }, { text: 'Chúc may mắn', color: '#fbbf24' },
    { text: '½ hoa cắm bình', color: '#e879f9' }, { text: 'Mini game', color: '#10b981' },
  ];

  return (
    <div className="wheel-layout">
      {/* Decorative Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      {/* Top Bar Area */}
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} color="#ef4444" /> : <Volume2 size={24} color="#10b981" />}
        </button>

        <button 
          className="icon-btn" 
          onClick={handleCheckIn}
          disabled={checkInInfo?.lastDate === new Date().toISOString().split('T')[0]}
          style={{ width: 'auto', padding: '0 15px', borderRadius: '25px', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }}
        >
          {checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? '✅' : '📅'}
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? 'Đã điểm danh' : 'Điểm danh'}</span>
          {checkInInfo?.streak > 0 && <span style={{ background: '#10b981', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>x{checkInInfo.streak}</span>}
        </button>

        <button className="icon-btn" onClick={() => setShowQuestModal(true)} style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }}>
          <Trophy size={22} color="#f59e0b" />
        </button>

        <div className="spacer" />

        <button className="icon-btn" onClick={() => setShowInventory(true)}>
          <Gift size={24} color="#60a5fa" />
          {inventory.length > 0 && <span className="badge">{inventory.length}</span>}
        </button>
        <button className="icon-btn" onClick={() => setShowHistory(true)}><Clock size={24} color="#a78bfa" /></button>
        
        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
          <LogOut size={16} /> <span className="hide-mobile">Rời đi</span>
        </button>
      </div>

      {/* Main Wheel View */}
      <div className="wheel-page">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card wheel-content">
          <div className="header">
            <h1 style={{ letterSpacing: '2px', fontSize: '2.5rem' }}>LUCKY WHEEL</h1>
            <p style={{ color: '#93c5fd', fontSize: '1.2rem' }}>Bạn có <strong style={{ color: '#fbbf24' }}>{spinsLeft}</strong> lượt quay</p>
          </div>

          <div className="wheel-container">
            <div className="wheel-pointer" />
            <motion.div className="wheel" animate={{ rotate: rotation }} transition={{ duration: 4.2, ease: [0.15, 0, 0.15, 1] }}>
               <svg viewBox="0 0 300 300" width="100%" height="100%">
                {prizes.map((p, i) => {
                  const angle = 360 / prizes.length;
                  const textAngle = i * angle + angle / 2;
                  return (
                    <g key={i}>
                      <path d={`M 150 150 L ${150 + 150 * Math.cos(i * angle * Math.PI / 180)} ${150 + 150 * Math.sin(i * angle * Math.PI / 180)} A 150 150 0 0 1 ${150 + 150 * Math.cos((i + 1) * angle * Math.PI / 180)} ${150 + 150 * Math.sin((i + 1) * angle * Math.PI / 180)} Z`} fill={p.color} stroke="rgba(255,255,255,0.2)" />
                      <text 
                        x={150 + 95 * Math.cos(textAngle * Math.PI / 180)} 
                        y={150 + 95 * Math.sin(textAngle * Math.PI / 180)} 
                        fill="white" 
                        fontSize="14" 
                        fontWeight="bold" 
                        textAnchor="middle" 
                        transform={`rotate(${textAngle}, ${150 + 95 * Math.cos(textAngle * Math.PI / 180)}, ${150 + 95 * Math.sin(textAngle * Math.PI / 180)})`}
                        style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
                      >
                        {p.text}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          </div>

          <button className="login-btn spin-btn" onClick={spinWheel} disabled={isSpinning || spinsLeft <= 0} style={{ padding: '1.2rem', fontSize: '1.3rem', borderRadius: '18px', filter: (isSpinning || spinsLeft <= 0) ? 'grayscale(1)' : 'none' }}>
            {isSpinning ? <RefreshCw className="spin-icon" /> : 'SPIN NOW'}
          </button>

          <AnimatePresence>
            {prize && !isSpinning && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="prize-announcement" style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid #fbbf24' }}>
                <Star color="#fbbf24" fill="#fbbf24" />
                <span>Chúc mừng! Bạn nhận được: <strong>{prize}</strong></span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Panel View */}
      <div className="right-panel">
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: '#60a5fa', marginBottom: '10px' }}>⚡ THANH NĂNG LƯỢNG</h3>
          <div style={{ width: '100%', height: '18px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(miniPoints, 100)}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', boxShadow: '0 0 15px #3b82f6' }} />
          </div>
          <p style={{ marginTop: '8px', fontWeight: 'bold' }}>{miniPoints} / 100 PT</p>
          <button className="login-btn" onClick={() => { setIsPractice(true); setIsMiniGameOpen(true); }} style={{ marginTop: '15px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: '0.85rem' }}>🎮 LUYỆN TẬP MINI GAME</button>
        </div>

        <div className="glass-card record-board" style={{ flex: 1 }}>
          <h3>🏆 KỶ LỤC CỦA BẠN</h3>
          <div className="record-list">
            {records.length > 0 ? records.map((r, i) => (
              <div key={i} className="record-item" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <span style={{ fontWeight: '500' }}>{r.gameName}</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{r.score}đ</span>
              </div>
            )) : <p style={{ color: '#475569', textAlign: 'center', marginTop: '1rem' }}>Chưa có kỷ lục nào</p>}
          </div>
        </div>

        <div className="glass-card requests-board">
          <h3>📦 YÊU CẦU QUÀ</h3>
          <div className="record-list">
            {inventory.filter(i => i.status !== 'Mới').length > 0 ? inventory.filter(i => i.status !== 'Mới').map(i => (
              <div key={i.id} className="record-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '600', color: '#c084fc' }}>{i.itemName}</div>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '5px', background: i.status === 'Đang chờ duyệt' ? '#f59e0b' : '#10b981', marginTop: '4px' }}>{i.status}</span>
              </div>
            )) : <p style={{ color: '#475569', textAlign: 'center' }}>Hòm thư trống</p>}
          </div>
        </div>
      </div>

      {/* --- Modals Area --- */}
      <AnimatePresence>
        {showQuestModal && (
          <>
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuestModal(false)} />
            <motion.div className="side-panel modal" initial={{ scale: 0.9, x: "-50%", y: "-50%" }} animate={{ scale: 1, x: "-50%", y: "-50%" }}>
              <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3>Thử Thách Ăn Uống 🍽️</h3>
                <button className="close-btn" onClick={() => setShowQuestModal(false)}><X /></button>
              </div>
              <div className="panel-content">
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center' }}>Hoàn thành đủ 3 bữa trong ngày để nhận ngay 1 lượt quay!</p>
                {['BREAKFAST', 'LUNCH', 'DINNER'].map(type => {
                  const status = getStatusFor(type);
                  const labels = { 'BREAKFAST': 'Bữa sáng (6h-10h)', 'LUNCH': 'Bữa trưa (12h-14h)', 'DINNER': 'Bữa tối (17h-21h)' };
                  return (
                    <div key={type} className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: status === 'AVAILABLE' ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{labels[type]}</div>
                        <div style={{ fontSize: '0.75rem', color: status === 'LOCKED' ? '#ef4444' : '#10b981' }}>
                          {status === 'LOCKED' ? '🔒 Chưa đến giờ' : status === 'PENDING' ? '⏳ Chờ duyệt' : status === 'APPROVED' ? '✅ Đã duyệt' : status === 'REJECTED' ? '❌ Bị từ chối' : '🟢 Sẵn sàng'}
                        </div>
                      </div>
                      {status === 'AVAILABLE' && <button onClick={() => setActiveQuestType(type)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Gửi ảnh</button>}
                    </div>
                  );
                })}

                {activeQuestType && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                    <div style={{ position: 'relative', border: '2px dashed #475569', borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {questImage ? <img src={questImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera color="#60a5fa" size={40} />}
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files[0]; if(f){ const r = new FileReader(); r.onloadend = () => setQuestImage(r.result); r.readAsDataURL(f); } }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                    <input type="text" placeholder="Ghi chú (tùy chọn)..." value={questNote} onChange={e=>setQuestNote(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '10px' }} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                      <button onClick={submitQuest} disabled={isSubmitting} style={{ flex: 2, background: '#10b981' }} className="login-btn">{isSubmitting ? 'Đang gửi...' : 'Nộp Nhiệm Vụ'}</button>
                      <button onClick={() => { setActiveQuestType(null); setQuestImage(null); }} style={{ flex: 1, background: '#ef4444' }} className="login-btn">Hủy</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Other Modals remain unchanged --- */}
      <MiniGameModal isOpen={isMiniGameOpen} isPractice={isPractice} isMuted={isMuted} onClose={() => { setIsMiniGameOpen(false); setIsPractice(false); fetchData(); }} username={username} fetchInventory={() => fetchData()} fetchHistory={() => fetchData()} onChestAwarded={(c) => { setChestsCount(c); setIsChestOpen(true); }} />
      <SlotMachineModal isOpen={isSlotMachineOpen} isMuted={isMuted} onClose={() => { setIsSlotMachineOpen(false); fetchData(); }} username={username} onSpinResult={(s) => setSpinsLeft(s)} fetchInventory={() => fetchData()} fetchHistory={() => fetchData()} />
      <ChestModal isOpen={isChestOpen} count={chestsCount} onClose={() => setIsChestOpen(false)} />
      
      {/* Inventory & History Modals */}
      <AnimatePresence>
        {showInventory && (
          <>
            <motion.div className="overlay" onClick={() => setShowInventory(false)} />
            <motion.div className="side-panel modal" initial={{ scale: 0.9, x: "-50%", y: "-50%" }} animate={{ scale: 1, x: "-50%", y: "-50%" }}>
              <div className="panel-header"><h3>Túi đồ của {username}</h3><button className="close-btn" onClick={() => setShowInventory(false)}><X/></button></div>
              <div className="panel-content">
                {inventory.filter(i => i.status === 'Mới').map(item => (
                    <div key={item.id} className="inventory-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.itemName}</span>
                        {!item.itemName.includes('½') && <button onClick={async () => { await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/wheel/inventory/${item.id}/use`); alert("Đã gửi yêu cầu!"); setShowInventory(false); fetchData(); }} style={{ background: '#10b981', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px' }}>Dùng</button>}
                    </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyWheel;
