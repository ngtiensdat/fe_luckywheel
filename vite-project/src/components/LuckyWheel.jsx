import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Gift, Clock, LogOut, X, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlotMachineModal from './SlotMachineModal';
import MiniGameModal from './MiniGameModal';
import ChestModal from './ChestModal';

// Sound effects URLs
const SOUNDS = {
  spin: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};

const LuckyWheel = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) {
      navigate('/login');
    }
  }, [username, navigate]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);

  const [spinsLeft, setSpinsLeft] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [showInventory, setShowInventory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [isSlotMachineOpen, setIsSlotMachineOpen] = useState(false);
  const [miniPoints, setMiniPoints] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [chestsCount, setChestsCount] = useState(0);

  // New states for Quest & Checkin
  const [checkInInfo, setCheckInInfo] = useState(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [questNote, setQuestNote] = useState("");
  const [questImage, setQuestImage] = useState(null);
  const [isSubmittingQuest, setIsSubmittingQuest] = useState(false);

  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!isSpinning) {
      if (prize === 'Slot Machine') {
        setIsSlotMachineOpen(true);
      } else if (prize === 'Mini game') {
        setIsMiniGameOpen(true);
      }
    }
  }, [isSpinning, prize]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/users/${username}`);
      setSpinsLeft(res.data.spins);
      setMiniPoints(res.data.miniGamePoints || 0);
      if (res.data.pendingMiniGame > 0) setIsMiniGameOpen(true);
      if (res.data.pendingSlotMachine > 0) setIsSlotMachineOpen(true);
    } catch (error) {
      console.error("Lỗi fetch user:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/inventory/${username}`);
      setInventory(res.data);
    } catch (error) {
      console.error("Lỗi fetch inventory:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/history/${username}`);
      setHistory(res.data);
    } catch (error) {
      console.error("Lỗi fetch history:", error);
    }
  };

  const [records, setRecords] = useState([]);
  const fetchRecords = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/records/${username}`);
      setRecords(res.data);
    } catch(e) {}
  };

  const fetchCheckInStatus = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/status/${username}`);
      setCheckInInfo(res.data);
    } catch(e) {}
  };

  useEffect(() => {
    if (username) {
      fetchUser();
      fetchInventory();
      fetchHistory();
      fetchRecords();
      fetchCheckInStatus();
    }
  }, [username]);

  const spinWheel = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    setIsSpinning(true);
    setPrize(null);
    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/spin/${username}`);
      const data = res.data;
      const targetIndex = data.index;
      if (targetIndex === undefined) return;
      const sliceAngle = 360 / prizes.length;
      const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);
      setRotation(prev => {
        const currentMod = prev % 360;
        let nextRot = prev + (360 * 10) + targetAngle - currentMod;
        if (nextRot <= prev + (360 * 10)) nextRot += 360;
        return nextRot;
      });
      setSpinsLeft(data.spinsLeft);
      setPrize(data.prize);
      playSound('spin');
      fetchInventory();
      fetchHistory();
    } catch (err) {
      alert("Lỗi backend!");
      setIsSpinning(false);
    }
    setTimeout(() => {
      setIsSpinning(false);
      playSound('win');
    }, 4200);
  };

  const useItem = async (id) => {
    try {
      await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/wheel/inventory/${id}/use`);
      fetchInventory(); 
      alert("Đã gửi yêu cầu sử dụng tới Admin!");
    } catch (error) { alert("Không thể dùng vật phẩm!"); }
  };

  const handleMerge = async (baseName, id1, id2) => {
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + '/api/wheel/inventory/merge', {
        id1, id2, newItemName: baseName, username
      });
      alert(`Đã ghép thành công vé hoàn chỉnh: ${baseName}!`);
      fetchInventory();
    } catch (e) { alert('Lỗi ghép vé'); }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/${username}`);
      alert("Điểm danh thành công!");
      fetchCheckInStatus();
      fetchUser();
    } catch(e) { alert(e.response?.data || "Lỗi điểm danh"); }
  };

  const handleQuestImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQuestImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitQuest = async () => {
    if (!questImage) return alert("Vui lòng chụp ảnh trước!");
    setIsSubmittingQuest(true);
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/submit/${username}`, {
        imageData: questImage, note: questNote
      });
      alert("Đã gửi nhiệm vụ! Đang chờ Admin duyệt.");
      setShowQuestModal(false); setQuestImage(null); setQuestNote("");
    } catch(e) { alert(e.response?.data || "Lỗi gửi nhiệm vụ"); }
    finally { setIsSubmittingQuest(false); }
  };

  const prizes = [
    { text: '½ Stabuck', color: '#f87171' },
    { text: '½ gội đầu', color: '#fb923c' },
    { text: 'Slot Machine', color: '#1e3a8a' },
    { text: '½ gội đầu mặt nạ', color: '#34d399' },
    { text: '½ massage mặt', color: '#60a5fa' },
    { text: '½ voucher 100k', color: '#818cf8' },
    { text: '+ 2 lượt quay', color: '#a78bfa' },
    { text: 'Chúc may mắn', color: '#fbbf24' },
    { text: '½ hoa cắm bình', color: '#e879f9' },
    { text: 'Mini game', color: '#10b981' },
  ];

  const availableInventory = inventory.filter(i => i.status === 'Mới');
  const mergeGroups = {};
  availableInventory.forEach(item => {
    if (item.itemName.startsWith("1/2 ")) {
      const baseName = item.itemName.replace("1/2 ", "").trim();
      if (!mergeGroups[baseName]) mergeGroups[baseName] = [];
      mergeGroups[baseName].push(item);
    }
  });

  const renderWheel = () => {
    const anglePerPrize = 360 / prizes.length;
    const center = 150; const radius = 150;
    return (
      <svg viewBox="0 0 300 300" width="100%" height="100%" style={{ transform: 'rotate(0deg)', overflow: 'hidden', borderRadius: '50%' }}>
        {prizes.map((p, i) => {
          const startAngle = (i * anglePerPrize) * Math.PI / 180;
          const endAngle = ((i + 1) * anglePerPrize) * Math.PI / 180;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const d = [`M ${center} ${center}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`, 'Z'].join(' ');
          const textAngle = i * anglePerPrize + anglePerPrize / 2;
          const textRadius = radius * 0.65;
          const cx = center + textRadius * Math.cos(textAngle * Math.PI / 180);
          const cy = center + textRadius * Math.sin(textAngle * Math.PI / 180);
          return (
            <g key={i}>
              <path d={d} fill={p.color} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
              <text x={cx} y={cy} fill="white" fontSize="15" fontWeight="700" textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${textAngle}, ${cx}, ${cy})`} style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}>
                {p.text}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r="20" fill="#172554" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
        <circle cx={center} cy={center} r="6" fill="#60a5fa" />
      </svg>
    );
  };

  return (
    <div className="wheel-layout">
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} color="#ef4444" /> : <Volume2 size={24} color="#10b981" />}
        </button>

        <button 
          className="icon-btn" 
          onClick={handleCheckIn}
          disabled={checkInInfo?.lastDate === new Date().toISOString().split('T')[0]}
          style={{ 
            width: 'auto', padding: '0 15px', borderRadius: '20px', gap: '8px',
            background: checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10b981'
          }}
        >
          {checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? '✅' : '📅'}
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>
            {checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? 'Đã điểm danh' : 'Điểm danh'}
            {checkInInfo?.streak > 0 && ` x${checkInInfo.streak}`}
          </span>
        </button>

        <button className="icon-btn" onClick={() => setShowInventory(true)}>
          <Gift size={24} color="#60a5fa" />
          {inventory.length > 0 && <span className="badge">{inventory.length}</span>}
        </button>
        <button className="icon-btn" onClick={() => setShowHistory(true)}>
          <Clock size={24} color="#a78bfa" />
        </button>
        <button className="icon-btn" onClick={() => setShowQuestModal(true)} style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b' }}>
          <Trophy size={24} color="#f59e0b" />
        </button>
        <div className="spacer"></div>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('username'); navigate('/login'); }}>
          <LogOut size={16} /> <span className="hide-mobile">Đăng xuất</span>
        </button>
      </div>

      <div className="wheel-page">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card wheel-content">
          <div className="header">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vòng Quay Thưởng </h1>
            <p style={{ fontSize: '1.2rem', color: '#93c5fd' }}>Bạn còn <strong>{spinsLeft}</strong> lượt quay!</p>
          </div>
          <div className="wheel-container">
            <div className="wheel-pointer"></div>
            <motion.div className="wheel" animate={{ rotate: rotation }} transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}>
              {renderWheel()}
            </motion.div>
          </div>
          <div className="actions" style={{ marginTop: '2.5rem' }}>
            <button className="login-btn spin-btn" onClick={spinWheel} disabled={isSpinning || spinsLeft <= 0} style={{ padding: '1.2rem', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', borderRadius: '16px', opacity: (isSpinning || spinsLeft <= 0) ? 0.7 : 1 }}>
              {isSpinning ? <RefreshCw className="spin-icon" size={24} /> : spinsLeft <= 0 ? 'HẾT LƯỢT' : 'QUAY NGAY'}
            </button>
          </div>
          <AnimatePresence>
            {prize && !isSpinning && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="prize-announcement">
                <Trophy size={32} color="#fbbf24" />
                <span>Bạn vừa mở ra: <strong style={{ color: '#fbbf24' }}>{prize}</strong></span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="right-panel">
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ color: '#60a5fa', textAlign: 'center', margin: 0 }}>🌟 Thanh Năng Lượng 🌟</h3>
          <div style={{ width: '100%', height: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(miniPoints, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #eab308)' }}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>{miniPoints} / 100</p>
          <button className="login-btn" onClick={() => { setIsPractice(true); setIsMiniGameOpen(true); }} style={{ marginTop: '10px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }}>🎮 Luyện Tập Mini Game</button>
        </div>

        <div className="glass-card record-board">
          <h3>🏆 Kỷ Lục Bản Thân</h3>
          <div className="record-list">
            {records.map((r, i) => (
              <div key={i} className="record-item">
                <span style={{ fontWeight: 'bold' }}>{r.gameName}</span>
                <span style={{ color: '#10b981' }}>{r.score}đ</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card requests-board">
          <h3>📦 Yêu cầu quà</h3>
          <div className="record-list">
            {inventory.filter(i => i.status !== 'Mới').map(i => (
              <div key={i.id} className="record-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color: '#c084fc' }}>{i.itemName}</span>
                <span className={`status-badge ${i.status === 'Đang chờ duyệt' ? 'pending' : 'approved'}`}>{i.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(showInventory || showHistory) && <motion.div className="overlay" onClick={() => { setShowInventory(false); setShowHistory(false); }} />}
      </AnimatePresence>

      {/* Modals for Inventory, History, Quest, etc. */}
      {/* (Tôi giữ nguyên các Modal này phía dưới) */}
      <MiniGameModal isOpen={isMiniGameOpen} isPractice={isPractice} isMuted={isMuted} onClose={() => { setIsMiniGameOpen(false); fetchUser(); }} username={username} fetchInventory={fetchInventory} fetchHistory={fetchHistory} onChestAwarded={(c) => { setChestsCount(c); setIsChestOpen(true); }} />
      <SlotMachineModal isOpen={isSlotMachineOpen} isMuted={isMuted} onClose={() => { setIsSlotMachineOpen(false); fetchUser(); }} username={username} onSpinResult={(s) => setSpinsLeft(s)} fetchInventory={fetchInventory} fetchHistory={fetchHistory} />
      <ChestModal isOpen={isChestOpen} count={chestsCount} onClose={() => setIsChestOpen(false)} />

      {/* --- Quest Modal --- */}
      <AnimatePresence>
        {showQuestModal && (
          <>
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuestModal(false)} />
            <motion.div className="side-panel modal" initial={{ scale: 0.9, x: "-50%", y: "-50%" }} animate={{ scale: 1, x: "-50%", y: "-50%" }}>
              <div className="panel-header"><h3>Nhiệm Vụ Hàng Ngày</h3><button onClick={() => setShowQuestModal(false)}>X</button></div>
              <div className="panel-content" style={{ textAlign: 'center' }}>
                <p>📸 Chụp đủ 3 bữa ăn để nhận 1 lượt quay!</p>
                <input type="file" accept="image/*" capture="environment" onChange={handleQuestImageChange} />
                {questImage && <img src={questImage} style={{ width: '100%', margin: '10px 0' }} />}
                <textarea placeholder="Ghi chú..." value={questNote} onChange={e => setQuestNote(e.target.value)} style={{ width: '100%', margin: '10px 0' }} />
                <button onClick={submitQuest} disabled={isSubmittingQuest || !questImage} className="login-btn">Gửi nhiệm vụ</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventory && (
          <motion.div className="side-panel modal" initial={{ scale: 0.9, x: "-50%", y: "-50%" }} animate={{ scale: 1, x: "-50%", y: "-50%" }}>
            <div className="panel-header"><h3>Túi đồ</h3><button onClick={() => setShowInventory(false)}>X</button></div>
            <div className="panel-content">
              {availableInventory.map(item => (
                <div key={item.id} className="inventory-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.itemName}</span>
                  {!item.itemName.includes("½") && <button onClick={() => useItem(item.id)}>Dùng</button>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyWheel;
