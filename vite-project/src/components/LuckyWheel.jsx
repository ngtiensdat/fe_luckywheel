import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Gift, Clock, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SlotMachineModal from './SlotMachineModal';
import MiniGameModal from './MiniGameModal';
import ChestModal from './ChestModal';
import { Volume2, VolumeX } from 'lucide-react';

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
  
  // Removed duplicated state
  const [showInventory, setShowInventory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [isSlotMachineOpen, setIsSlotMachineOpen] = useState(false);
  const [miniPoints, setMiniPoints] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [chestsCount, setChestsCount] = useState(0);

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

  useEffect(() => {
  if (username) {
    fetchUser();
    fetchInventory();
    fetchHistory();
  }
}, [username]);
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

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/login');
  };

  const spinWheel = async () => {
  if (isSpinning || spinsLeft <= 0) return;

  setIsSpinning(true);
  setPrize(null);

  try {
    const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/spin/${username}`);
    const data = res.data;

    const targetIndex = data.index;

    if (targetIndex === undefined || targetIndex < 0) {
      console.error("Backend chưa trả index!", data);
      setIsSpinning(false);
      return;
    }

    // 🎯 TÍNH GÓC QUAY
    const sliceAngle = 360 / prizes.length;
    
    // GÓC DỪNG MỤC TIÊU CỦA ĐỒ THỊ
    const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2);

    setRotation(prev => {
      const currentMod = prev % 360;
      let nextRot = prev + (360 * 10) + targetAngle - currentMod;
      if (nextRot <= prev + (360 * 10)) {
        nextRot += 360;
      }
      return nextRot;
    });

    setSpinsLeft(data.spinsLeft);
    setPrize(data.prize);
    playSound('spin');

    fetchInventory();
    fetchHistory();

  } catch (err) {
    alert("Lỗi backend!");
    console.error(err);
    setIsSpinning(false);
    return;
  }

  setTimeout(() => {
    setIsSpinning(false);
    playSound('win');
  }, 4200);
};

  const fetchUser = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/users/${username}`);
      setSpinsLeft(res.data.spins);
      setMiniPoints(res.data.miniGamePoints || 0);
      
      // Auto open if there are pending games
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

  const [records, setRecords] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/history/${username}`);
      setHistory(res.data);
    } catch (error) {
      console.error("Lỗi fetch history:", error);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/wheel/records/${username}`);
      setRecords(res.data);
    } catch(e) {}
  };

  useEffect(() => {
    if (username) {
      fetchUser();
      fetchInventory();
      fetchHistory();
      fetchRecords();
    }
  }, [username]);

  const useItem = async (id) => {
    try {
      await axios.put(import.meta.env.VITE_API_BASE_URL + `/api/wheel/inventory/${id}/use`);
      fetchInventory(); 
      alert("Đã gửi yêu cầu sử dụng tới Admin!");
    } catch (error) {
      console.error("Lỗi dùng item:", error);
      alert("Không thể dùng vật phẩm!");
    }
  };

  const handleMerge = async (baseName, id1, id2) => {
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + '/api/wheel/inventory/merge', {
        id1, id2, newItemName: baseName, username
      });
      alert(`Đã ghép thành công vé hoàn chỉnh: ${baseName}!`);
      fetchInventory();
    } catch (e) {
      console.error(e);
      alert('Lỗi ghép vé');
    }
  };

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
    const totalPrizes = prizes.length;
    const anglePerPrize = 360 / totalPrizes;
    const center = 150;
    const radius = 150;

    return (
      <svg viewBox="0 0 300 300" width="100%" height="100%" style={{ transform: 'rotate(0deg)', overflow: 'hidden', borderRadius: '50%' }}>
        {prizes.map((p, i) => {
          const startAngle = (i * anglePerPrize) * Math.PI / 180;
          const endAngle = ((i + 1) * anglePerPrize) * Math.PI / 180;
          
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          
          const d = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          const textAngle = i * anglePerPrize + anglePerPrize / 2;
          const textRadius = radius * 0.65; 
          
          const cx = center + textRadius * Math.cos(textAngle * Math.PI / 180);
          const cy = center + textRadius * Math.sin(textAngle * Math.PI / 180);

          return (
            <g key={i}>
              <path d={d} fill={p.color} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
              <text
                x={cx}
                y={cy}
                fill="white"
                fontSize="15"
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${textAngle}, ${cx}, ${cy})`}
                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
              >
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
      {/* Thanh Top Bar chứa các Icons */}
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} color="#ef4444" /> : <Volume2 size={24} color="#10b981" />}
        </button>

        <button className="icon-btn" onClick={() => setShowInventory(true)}>
          <Gift size={24} color="#60a5fa" />
          {inventory.length > 0 && <span className="badge">{inventory.length}</span>}
        </button>
        
        <button className="icon-btn" onClick={() => setShowHistory(true)}>
          <Clock size={24} color="#a78bfa" />
        </button>
        
        <div className="spacer"></div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> <span className="hide-mobile">Đăng xuất</span>
        </button>
      </div>

      {/* Vòng quay ở trung tâm */}
      <div className="wheel-page">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card wheel-content"
        >
          <div className="header">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Vòng Quay Thưởng </h1>
            <p style={{ fontSize: '1.2rem', color: '#93c5fd' }}>
              Bạn còn <strong>{spinsLeft}</strong> lượt quay!
            </p>
          </div>

          <div className="wheel-container">
            <div className="wheel-pointer"></div>
            <motion.div 
              className="wheel"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
              style={{ background: 'transparent' }}
            >
              {renderWheel()}
            </motion.div>
          </div>

          <div className="actions" style={{ marginTop: '2.5rem' }}>
            <button 
              className="login-btn spin-btn" 
              onClick={spinWheel}
              disabled={isSpinning || spinsLeft <= 0}
              style={{ 
                padding: '1.2rem', 
                fontSize: '1.2rem', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                borderRadius: '16px',
                opacity: (isSpinning || spinsLeft <= 0) ? 0.7 : 1,
                cursor: (isSpinning || spinsLeft <= 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSpinning ? <RefreshCw className="spin-icon" size={24} /> : 
               spinsLeft <= 0 ? 'HẾT LƯỢT' : 'QUAY NGAY'}
            </button>
          </div>

          <AnimatePresence>
            {prize && !isSpinning && (
              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="prize-announcement"
                style={{ fontSize: '1.2rem', marginTop: '1.5rem', padding: '1.2rem' }}
              >
                <Trophy size={32} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span>Bạn vừa mở ra: <strong style={{ color: '#fbbf24' }}>{prize}</strong></span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* --- RIGHT PANEL (Records & Requests) --- */}
      <div className="right-panel">
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ color: '#60a5fa', textAlign: 'center', margin: 0 }}>🌟 Thanh Năng Lượng 🌟</h3>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Đạt 100 điểm để nhận Rương Báu!</p>
          <div style={{ width: '100%', height: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((miniPoints / 100) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #eab308)', transition: 'width 0.5s ease-out' }}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>{miniPoints} / 100</p>
          <button 
                className="login-btn" 
                onClick={() => { setIsPractice(true); setIsMiniGameOpen(true); }}
                style={{ marginTop: '10px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)', padding: '0.8rem', fontSize: '0.9rem', borderRadius: '10px', width: '100%', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                🎮 Luyện Tập Mini Game
          </button>
        </div>

        <div className="glass-card record-board">
          <h3>🏆 Kỷ Lục Bản Thân</h3>
          <div className="record-list">
            {records.length > 0 ? records
              .filter((v, i, a) => a.findIndex(t => t.gameName === v.gameName) === i)
              .map((r, i) => (
              <div key={i} className="record-item">
                <span style={{ fontWeight: 'bold' }}>{r.gameName}</span>
                <span style={{ color: '#10b981' }}>{r.score}đ</span>
              </div>
            )) : <div className="empty-text">Chưa có kỷ lục nào</div>}
          </div>
        </div>

        <div className="glass-card requests-board">
          <h3>📦 Yêu cầu quà</h3>
          <div className="record-list">
            {inventory.filter(i => i.status !== 'Mới').length > 0 ? 
              inventory.filter(i => i.status !== 'Mới').map(i => (
              <div key={i.id} className="record-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                <span style={{ fontWeight: 'bold', color: '#c084fc' }}>{i.itemName}</span>
                <span className={`status-badge ${i.status === 'Đang chờ duyệt' ? 'pending' : (i.status === 'Đã duyệt' ? 'approved' : 'rejected')}`}>
                  {i.status}
                </span>
              </div>
            )) : <div className="empty-text">Danh sách trống</div>}
          </div>
        </div>
      </div>

      {/* --- Overlay & Modals --- */}
      <AnimatePresence>
        {(showInventory || showHistory) && (
          <motion.div 
            className="overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => { setShowInventory(false); setShowHistory(false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInventory && (
          <motion.div 
            className="side-panel modal"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          >
            <div className="panel-header">
              <h3>Túi đồ của {username}</h3>
              <button className="close-btn" onClick={() => setShowInventory(false)}><X size={20} /></button>
            </div>
            
            {/* Thanh hiển thị Ghép Thẻ */}
            {Object.keys(mergeGroups).filter(k => mergeGroups[k].length >= 2).length > 0 && (
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid var(--glass-border)', padding: '1rem' }}>
                <h4 style={{ color: '#60a5fa', marginBottom: '10px' }}>🛠 Có thể ghép vé hoàn chỉnh:</h4>
                {Object.keys(mergeGroups).map(baseName => {
                  const pieces = mergeGroups[baseName];
                  if (pieces.length >= 2) {
                    return (
                      <div key={baseName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '5px' }}>
                        <span>Ghép 2 mảnh: <strong>{baseName}</strong></span>
                        <button 
                          onClick={() => handleMerge(baseName, pieces[0].id, pieces[1].id)}
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >Ghép ngay</button>
                      </div>
                    )
                  }
                  return null;
                })}
              </div>
            )}

            <div className="panel-content">
              {(() => {
                const grouped = availableInventory.reduce((acc, item) => {
                  const existing = acc.find(i => i.itemName === item.itemName);
                  if (existing) {
                    existing.count++;
                    existing.ids.push(item.id);
                  } else {
                    acc.push({ ...item, count: 1, ids: [item.id] });
                  }
                  return acc;
                }, []);

                return grouped.length > 0 ? (
                  grouped.map((item) => (
                    <motion.div 
                      key={item.itemName} 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="inventory-item"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.itemName}</span>
                        {item.count > 1 && (
                          <span style={{ 
                            background: 'rgba(59, 130, 246, 0.2)', 
                            color: '#60a5fa', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            x{item.count}
                          </span>
                        )}
                      </div>
                      
                      {item.itemName.includes("½") ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cần ghép mảnh</span>
                      ) : (
                        <button 
                          onClick={() => useItem(item.ids[0])}
                          style={{
                            background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px',
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                          }}
                        >
                          Dùng
                        </button>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-text">Túi đồ của bạn đang trống. Hãy quay vòng quay để nhận quà!</div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="side-panel modal"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          >
            <div className="panel-header">
              <Clock size={20} color="#a78bfa" />
              <h3>Lịch Sử Quay</h3>
              <button className="close-btn" onClick={() => setShowHistory(false)}><X size={20} /></button>
            </div>
            <div className="panel-content">
              {history.length === 0 ? (
                <p className="empty-text">Chưa có lịch sử quay.</p>
              ) : (
                <AnimatePresence>
                  {history.map((record, idx) => (
                    <motion.div key={record.id} className="history-item">
                      <span className="time">{record.createdAt}</span>
                      <span className="item">{record.prize}</span>
                    </motion.div>
))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MiniGameModal 
        isOpen={isMiniGameOpen} 
        isPractice={isPractice}
        isMuted={isMuted}
        onClose={() => {
          setIsMiniGameOpen(false);
          setIsPractice(false);
          fetchUser(); // Refresh points!
        }} 
        username={username}
        fetchInventory={fetchInventory}
        fetchHistory={fetchHistory}
        onChestAwarded={(count) => {
          setChestsCount(count);
          setIsChestOpen(true);
        }}
      />
      <SlotMachineModal 
        isOpen={isSlotMachineOpen} 
        isMuted={isMuted}
        onClose={() => {
          setIsSlotMachineOpen(false);
          fetchUser();
        }} 
        username={username}
        onSpinResult={(newSpins) => setSpinsLeft(newSpins)}
        fetchInventory={fetchInventory}
        fetchHistory={fetchHistory}
      />

      <ChestModal 
        isOpen={isChestOpen} 
        count={chestsCount}
        onClose={() => setIsChestOpen(false)}
      />

    </div>
  );
};

export default LuckyWheel;
