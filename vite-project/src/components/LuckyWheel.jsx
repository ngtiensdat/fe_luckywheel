import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Gift, Clock, LogOut, X, Volume2, VolumeX, Camera } from 'lucide-react';
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
    if (!username) navigate('/login');
  }, [username, navigate]);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [miniPoints, setMiniPoints] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [chestsCount, setChestsCount] = useState(0);

  // Check-in & Quest States
  const [checkInInfo, setCheckInInfo] = useState(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [dailyStatus, setDailyStatus] = useState([]); // Array of DailyQuest from backend
  const [activeQuestType, setActiveQuestType] = useState(null); // BREAKFAST, LUNCH, DINNER
  const [questImage, setQuestImage] = useState(null);
  const [questNote, setQuestNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/users/${username}`);
      setSpinsLeft(res.data.spins);
      setMiniPoints(res.data.miniGamePoints || 0);
    } catch (e) {}
  };

  const fetchCheckInStatus = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/status/${username}`);
      setCheckInInfo(res.data);
    } catch(e) {}
  };

  const fetchDailyStatus = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_BASE_URL + `/api/quests/daily-status/${username}`);
      setDailyStatus(res.data);
    } catch(e) {}
  };

  useEffect(() => {
    if (username) {
      fetchUser();
      fetchCheckInStatus();
      fetchDailyStatus();
      // ... others
    }
  }, [username]);

  const handleCheckIn = async () => {
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/checkin/${username}`);
      alert("Điểm danh thành công! Nhận 1 lượt quay (nếu là ngày thứ 2 liên tiếp)");
      fetchCheckInStatus();
      fetchUser();
    } catch(e) { alert(e.response?.data || "Lỗi điểm danh"); }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQuestImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitQuest = async () => {
    if (!questImage) return alert("Vui lòng chụp ảnh!");
    setIsSubmitting(true);
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/quests/submit/${username}`, {
        questType: activeQuestType,
        imageData: questImage,
        note: questNote
      });
      alert("Đã nộp! Vui lòng chờ Admin duyệt.");
      setQuestImage(null); setQuestNote(""); setActiveQuestType(null);
      fetchDailyStatus();
    } catch(e) { alert(e.response?.data || "Lỗi nộp bài"); }
    finally { setIsSubmitting(false); }
  };

  const isTimeFor = (type) => {
    const now = new Date();
    const hour = now.getHours();
    if (type === 'BREAKFAST') return hour >= 6 && hour < 10;
    if (type === 'LUNCH') return hour >= 12 && hour < 14;
    if (type === 'DINNER') return hour >= 17 && hour < 21;
    return false;
  };

  const getStatusFor = (type) => {
    const quest = dailyStatus.find(q => q.questType === type);
    if (quest) return quest.status; // PENDING, APPROVED, REJECTED
    return isTimeFor(type) ? 'AVAILABLE' : 'LOCKED';
  };

  const spinWheel = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    setIsSpinning(true); setPrize(null);
    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/spin/${username}`);
      const data = res.data;
      const sliceAngle = 360 / 10;
      const targetAngle = 360 - (data.index * sliceAngle + sliceAngle / 2);
      setRotation(prev => prev + (360 * 5) + targetAngle - (prev % 360));
      setSpinsLeft(data.spinsLeft); setPrize(data.prize);
      new Audio(SOUNDS.spin).play();
    } catch(e) { setIsSpinning(false); }
    setTimeout(() => { setIsSpinning(false); new Audio(SOUNDS.win).play(); }, 4000);
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
          {checkInInfo?.lastDate === new Date().toISOString().split('T')[0] ? '✅ Đã điểm danh' : '📅 Điểm danh'}
          {checkInInfo?.streak > 1 && ` x${checkInInfo.streak}`}
        </button>

        <button className="icon-btn" onClick={() => setShowQuestModal(true)}>
          <Trophy size={24} color="#fbbf24" />
        </button>

        <div className="spacer"></div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
          <LogOut size={16} /> <span className="hide-mobile">Đăng xuất</span>
        </button>
      </div>

      <div className="wheel-page">
        <div className="glass-card wheel-content">
          <div className="header">
            <h1>Vòng Quay May Mắn</h1>
            <p>Lượt quay còn lại: <strong>{spinsLeft}</strong></p>
          </div>
          <div className="wheel-container">
            <div className="wheel-pointer" />
            <motion.div className="wheel" animate={{ rotate: rotation }} transition={{ duration: 4, ease: "easeOut" }}>
              <svg viewBox="0 0 300 300" width="100%" height="100%">
                {prizes.map((p, i) => (
                  <g key={i}>
                    <path d={`M 150 150 L ${150 + 150 * Math.cos(i * 36 * Math.PI / 180)} ${150 + 150 * Math.sin(i * 36 * Math.PI / 180)} A 150 150 0 0 1 ${150 + 150 * Math.cos((i + 1) * 36 * Math.PI / 180)} ${150 + 150 * Math.sin((i + 1) * 36 * Math.PI / 180)} Z`} fill={p.color} stroke="white" strokeWidth="1" />
                    <text x={150 + 100 * Math.cos((i * 36 + 18) * Math.PI / 180)} y={150 + 100 * Math.sin((i * 36 + 18) * Math.PI / 180)} fill="white" fontSize="10" textAnchor="middle" transform={`rotate(${i * 36 + 18 + 90}, ${150 + 100 * Math.cos((i * 36 + 18) * Math.PI / 180)}, ${150 + 100 * Math.sin((i * 36 + 18) * Math.PI / 180)})`}>{p.text}</text>
                  </g>
                ))}
              </svg>
            </motion.div>
          </div>
          <button className="login-btn spin-btn" onClick={spinWheel} disabled={isSpinning || spinsLeft <= 0}>
            {isSpinning ? <RefreshCw className="spin-icon" /> : 'QUAY NGAY'}
          </button>
        </div>
      </div>

      {/* --- Quest Modal --- */}
      <AnimatePresence>
        {showQuestModal && (
          <>
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuestModal(false)} />
            <motion.div className="side-panel modal" initial={{ scale: 0.9, x: "-50%", y: "-50%" }} animate={{ scale: 1, x: "-50%", y: "-50%" }}>
              <div className="panel-header">
                <h3>Nhiệm vụ nhận lượt 🎁</h3>
                <button onClick={() => setShowQuestModal(false)}><X /></button>
              </div>
              <div className="panel-content">
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>Hoàn thành 3 bữa ăn (Sáng, Trưa, Tối) để nhận 1 lượt quay!</p>
                
                {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
                    const status = getStatusFor(type);
                    const label = type === 'BREAKFAST' ? 'Bữa sáng (6h-10h)' : type === 'LUNCH' ? 'Bữa trưa (12h-14h)' : 'Bữa tối (17h-21h)';
                    
                    return (
                        <div key={type} className="glass-card" style={{ padding: '1rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: status === 'AVAILABLE' ? '1px solid #10b981' : '1px solid #334155' }}>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: '600' }}>{label}</div>
                                <div style={{ fontSize: '0.75rem', color: status === 'LOCKED' ? '#ef4444' : '#10b981' }}>
                                    {status === 'LOCKED' ? '🔒 Chưa đến giờ' : 
                                     status === 'PENDING' ? '⏳ Đang chờ duyệt' :
                                     status === 'APPROVED' ? '✅ Đã duyệt' :
                                     status === 'REJECTED' ? '❌ Bị từ chối' : '🟢 Đang diễn ra'}
                                </div>
                            </div>
                            {status === 'AVAILABLE' && (
                                <button onClick={() => setActiveQuestType(type)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer' }}>Gửi ảnh</button>
                            )}
                        </div>
                    );
                })}

                {/* Submit Form Area */}
                {activeQuestType && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <div style={{ position: 'relative', border: '2px dashed #334155', borderRadius: '10px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {questImage ? <img src={questImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera color="#94a3b8" size={32} />}
                            <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </div>
                        <input type="text" placeholder="Ghi chú (tùy chọn)..." value={questNote} onChange={e=>setQuestNote(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '5px' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={submitQuest} disabled={isSubmitting} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px' }}>{isSubmitting ? 'Đang nộp...' : 'Nộp ảnh'}</button>
                            <button onClick={() => setActiveQuestType(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px' }}>Hủy</button>
                        </div>
                    </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyWheel;
