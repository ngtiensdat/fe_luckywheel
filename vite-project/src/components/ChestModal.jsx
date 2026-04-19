import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X } from 'lucide-react';

const ChestModal = ({ isOpen, onClose, count = 1 }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="overlay" style={{ zIndex: 2000 }}>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            className="glass-card"
            style={{ 
              maxWidth: '400px', 
              width: '90%', 
              textAlign: 'center', 
              padding: '3rem 2rem', 
              position: 'relative',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #fbbf24',
              boxShadow: '0 0 50px rgba(251, 191, 36, 0.3)'
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '5rem', marginBottom: '1.5rem' }}
            >
              🎁
            </motion.div>
            
            <h2 style={{ color: '#fbbf24', fontSize: '2rem', marginBottom: '1rem' }}>CHÚC MỪNG!</h2>
            <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              Năng lượng đã đầy! Bạn nhận được {count > 1 ? `x${count} ` : ''} 
              <strong style={{ color: '#fbbf24' }}> Rương Báu Kho Báu</strong>
            </p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Vật phẩm bên trong:</p>
              <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', margin: '5px 0 0 0' }}>"Chưa nghĩ ra"</p>
            </div>

            <button 
              onClick={onClose}
              style={{ 
                width: '100%', 
                padding: '1rem', 
                background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)'
              }}
            >
              NHẬN QUÀ & ĐÓNG
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChestModal;
