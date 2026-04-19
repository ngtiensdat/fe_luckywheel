import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, X, HelpCircle } from 'lucide-react';
import axios from 'axios';

const SlotMachineModal = ({ isOpen, onClose, username, onSpinResult, fetchInventory, fetchHistory, isMuted }) => {
  const [reels, setReels] = useState([1, 2, 3]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [prize, setPrize] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const playSound = (url) => {
    if (isMuted) return;
    new Audio(url).play().catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      setReels([1, 2, 3]);
      setPrize(null);
      setHasSpun(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isSpinning) {
      interval = setInterval(() => {
        setReels([
          Math.floor(Math.random() * 5) + 1,
          Math.floor(Math.random() * 5) + 1,
          Math.floor(Math.random() * 5) + 1,
        ]);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSpinning]);

  const handleSpin = async () => {
    if (isSpinning || hasSpun) return;
    
    // Animate lever
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);

    setIsSpinning(true);
    setPrize(null);
    playSound('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'); // spin sound

    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/spin-slot/${username}`);
      const data = res.data;

      setTimeout(() => {
        setIsSpinning(false);
        playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // win/result
        
        // Backend now handles the probability and provides the 3 numbers
        if (data.reels) {
          setReels(data.reels);
        }
        
        setPrize(data.prize);
        onSpinResult(data.spinsLeft);
        fetchInventory();
        fetchHistory();
        setHasSpun(true);
      }, 2000);

    } catch (err) {
      console.error(err);
      alert(err.response?.data || "Lỗi backend!");
      setIsSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay overlay-slot" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        className="glass-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Trophy size={28} />
            Slot Machine
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isSpinning && !hasSpun && (
              <>
                <button onClick={() => setShowHelp(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}>
                  <HelpCircle size={22} />
                </button>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </>
            )}
            {hasSpun && !isSpinning && (
               <button onClick={onClose} style={{ background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px 10px', borderRadius: '5px' }}>
                  Đóng
               </button>
            )}
          </div>
        </div>

        {showHelp && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Hướng dẫn Slot Machine</h3>
            <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
              Gạt cần để máy tự quay 3 con số ngẫu nhiên.<br/><br/>
              Nếu quay trúng <strong>3 SỐ GIỐNG NHAU</strong>, bạn sẽ nhận được phần thưởng đặc biệt vào Túi Đồ!<br/>
              Bạn chỉ có thể gạt cần 1 lần duy nhất cho mỗi vé Slot Machine.
            </p>
            <button onClick={() => setShowHelp(false)} style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer' }}>Quay lại trò chơi</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '1.5rem', paddingRight: '20px' }}>
          
          {/* Main Slot Body */}
          <div style={{ 
            background: '#1e293b', 
            padding: '1.5rem', 
            borderRadius: '16px', 
            border: '4px solid #334155',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            gap: '1rem',
            zIndex: 2,
            position: 'relative'
          }}>
            {reels.map((val, idx) => (
              <motion.div 
                key={idx}
                style={{
                  width: '70px',
                  height: '90px',
                  background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
                  border: '3px solid #64748b',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                  fontWeight: '900',
                  color: '#0f172a',
                  boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.3)',
                  textShadow: '0px 2px 2px rgba(255,255,255,0.8)'
                }}
              >
                {val}
              </motion.div>
            ))}
          </div>

          {/* Lever Mechanism */}
          <div style={{ position: 'relative', width: '40px', height: '140px', marginLeft: '-10px', zIndex: 1 }}>
             {/* Base of Lever */}
             <div style={{ 
               position: 'absolute', 
               bottom: '20px', 
               left: '0', 
               width: '30px', 
               height: '70px', 
               background: 'linear-gradient(to right, #475569, #334155)', 
               borderTopRightRadius: '15px', 
               borderBottomRightRadius: '15px', 
               border: '2px solid #1e293b', 
               borderLeft: 'none',
               boxShadow: '5px 5px 10px rgba(0,0,0,0.4)'
             }}></div>
             
             {/* Animating Lever Rod */}
             <motion.div
               animate={{ y: leverPulled ? 60 : 0 }}
               transition={{ type: 'spring', stiffness: 300, damping: 15 }}
               style={{ 
                 position: 'absolute', 
                 bottom: '60px', 
                 left: '10px', 
                 width: '12px', 
                 height: '80px', 
                 background: 'linear-gradient(to right, #94a3b8, #f8fafc, #94a3b8)', 
                 borderRadius: '6px',
                 boxShadow: '2px 0 5px rgba(0,0,0,0.3)'
               }}
             >
                {/* Knob (Clickable) */}
                <div 
                   onClick={handleSpin}
                   title={hasSpun ? "Mỗi lần trúng chỉ được gạt 1 lần!" : (isSpinning ? "Đang quay..." : "Gạt cần!")}
                   style={{ 
                     position: 'absolute', 
                     top: '-25px', 
                     left: '-14px', 
                     width: '40px', 
                     height: '40px', 
                     background: 'radial-gradient(circle at 12px 12px, #ef4444, #991b1b)', 
                     borderRadius: '50%', 
                     boxShadow: '0 5px 10px rgba(0,0,0,0.5)',
                     cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer',
                     border: '2px solid #7f1d1d',
                     opacity: hasSpun ? 0.5 : 1
                   }}
                />
             </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {prize && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ marginTop: '1.5rem', fontSize: '1.1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            >
              Lượt quay ra: <strong style={{ color: '#fbbf24' }}>{prize}</strong>
              <div style={{ marginTop: '1rem' }}>
                <button onClick={onClose} style={{ padding: '0.8rem 2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Xác Nhận & Đóng</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SlotMachineModal;
