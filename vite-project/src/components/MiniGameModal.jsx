import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RefreshCw, Star, HelpCircle } from 'lucide-react';
import axios from 'axios';

const GRID_SIZE = 15;
let GAME_TIME = 30;

const MiniGameModal = ({ isOpen, onClose, username, fetchInventory, fetchHistory, isPractice = false, isMuted, onChestAwarded }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [isReady, setIsReady] = useState(false); // To handle "Start" button
  const [isGameFinished, setIsGameFinished] = useState(false); // To handle "1 play per game"

  const playSound = (url) => {
    if (isMuted) return;
    new Audio(url).play().catch(() => {});
  };

  // Snake State
  const [snake, setSnake] = useState([[7, 7]]);
  const [food, setFood] = useState([3, 3]);
  const [direction, setDirection] = useState([0, -1]); // Up
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const directionRef = useRef([0, -1]);
  const processedTurnRef = useRef(false);

  // Guess Number State
  const [targetNumber, setTargetNumber] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [guessHistory, setGuessHistory] = useState([]);
  const [triesLeft, setTriesLeft] = useState(5);
  const [guessGameOver, setGuessGameOver] = useState(false);

  // Whack-a-Mole State
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [moleScore, setMoleScore] = useState(0);
  const [moleTimeLeft, setMoleTimeLeft] = useState(20);
  const [molePlaying, setMolePlaying] = useState(false);
  const [moleGameOver, setMoleGameOver] = useState(false);

  // Memory Game State
  const MEMORY_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🍎', '🍏', '🍊', '🍋', '🍒', '🍓', '🍇', '🍉', '🍑', '🍍'];
  const [cards, setCards] = useState([]);
  const [flippedIndex, setFlippedIndex] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [memoryTimeLeft, setMemoryTimeLeft] = useState(30);
  const [memoryPlaying, setMemoryPlaying] = useState(false);
  const [memoryGameOver, setMemoryGameOver] = useState(false);

  // Block Blast deleted

  // Memory Game State...
  // Cups Game State
  const [cups, setCups] = useState([0, 1, 2]); // Indices
  const [duckPos, setDuckPos] = useState(1); // Index where duck is
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleTimeLeft, setShuffleTimeLeft] = useState(10);
  const [revealed, setRevealed] = useState(false);
  const [cupsGameOver, setCupsGameOver] = useState(false);

  // General...
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // --- CUPS GAME LOGIC ---
  const startCupsGame = () => {
    setCups([0, 1, 2].sort(() => Math.random() - 0.5)); // Ngẫu nhiên vị trí khởi đầu của bát
    setDuckPos(Math.floor(Math.random() * 3));
    setIsShuffling(false);
    setRevealed(true); // QUAN TRỌNG: Hiện vịt cho người chơi thấy trước
    setCupsGameOver(false);
    setShuffleTimeLeft(10);
    setIsReady(true);
  };

  const startShuffling = () => {
    setIsShuffling(true);
    setRevealed(false);
    let time = 10;
    const speed = difficulty === 'easy' ? 800 : difficulty === 'medium' ? 500 : 300;
    
    // Shuffle interval
    const shuffleInterval = setInterval(() => {
      setCups(prev => {
        const next = [...prev];
        const idx1 = Math.floor(Math.random() * 3);
        let idx2 = Math.floor(Math.random() * 3);
        while(idx1 === idx2) idx2 = Math.floor(Math.random() * 3);
        [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
        return next;
      });
    }, speed);

    // Timer interval
    const timerInterval = setInterval(() => {
      time -= 1;
      setShuffleTimeLeft(time);
      if (time <= 0) {
        clearInterval(shuffleInterval);
        clearInterval(timerInterval);
        setIsShuffling(false);
      }
    }, 1000);
  };

  const handleCupClick = (idx) => {
    if (isShuffling || revealed || cupsGameOver) return;
    setRevealed(true);
    setCupsGameOver(true);
    setIsGameFinished(true);
    
    const isWin = (idx === duckPos);
    if (isWin) {
      playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      if (!rewardClaimed) {
        setRewardClaimed(true);
        addMiniGamePoints(15);
        saveRecord('Tìm Vị', 100);
      }
    } else {
      if (!rewardClaimed) {
        setRewardClaimed(true);
        saveRecord('Tìm Vị', 0);
      }
    }
  };

  // ... (giữ nguyên phần còn lại) ...

  useEffect(() => {
    if (isOpen) {
      setSelectedGame(null);
      setRewardClaimed(false);
      setIsReady(false);
      setIsGameFinished(false);
    }
  }, [isOpen]);

  const addMiniGamePoints = async (earnedPoints) => {
    if (isPractice) return; // Không cộng điểm khi luyện tập
    try {
      const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 4;
      const finalPoints = earnedPoints * multiplier;
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/add-points/${username}`, { points: finalPoints });
      if (res.data.chestsAwarded > 0 && onChestAwarded) {
        onChestAwarded(res.data.chestsAwarded);
      }
      if (fetchInventory) fetchInventory();
    } catch (err) {
      console.error('Lỗi nhận điểm mini game', err);
    }
  };

  const saveRecord = async (gameName, score) => {
    if (isPractice) return; // Không lưu kỷ lục khi luyện tập
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL + '/api/wheel/record', { username, gameName, score });
    } catch (err) {}
  };

  // --- SNAKE GAME LOGIC ---
  const startSnakeGame = () => {
    setSnake([[7, 7]]);
    setFood([Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]);
    setDirection([0, -1]);
    directionRef.current = [0, -1];
    setScore(0);
    const tm = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 30 : 20;
    setTimeLeft(tm);
    setIsPlaying(true);
    setGameOver(false);
    setIsReady(true);
  };

  const endSnakeGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    setIsGameFinished(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedGame === 'snake' && isPlaying && !gameOver) {
        if (e.key === 'ArrowUp') changeDirection([0, -1]);
        if (e.key === 'ArrowDown') changeDirection([0, 1]);
        if (e.key === 'ArrowLeft') changeDirection([-1, 0]);
        if (e.key === 'ArrowRight') changeDirection([1, 0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame, isPlaying, gameOver]);

  useEffect(() => {
    let timerId;
    if (isPlaying && !gameOver && selectedGame === 'snake') {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endSnakeGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isPlaying, gameOver, selectedGame]);

  useEffect(() => {
    let moveId;
    if (isPlaying && !gameOver && selectedGame === 'snake') {
      const speed = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 200 : 80;
      moveId = setInterval(() => {
        setSnake(prev => {
          const rawDir = directionRef.current;
          const head = prev[0];
          const newHead = [head[0] + rawDir[0], head[1] + rawDir[1]];

          // Check Wall collision
          if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
            endSnakeGame();
            return prev;
          }

          // Check Self collision
          if (prev.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
            endSnakeGame();
            return prev;
          }

          processedTurnRef.current = false; // Allow next turn
          const newSnake = [newHead, ...prev];

          // Check Food
          if (newHead[0] === food[0] && newHead[1] === food[1]) {
            setScore(s => s + 10);
            playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setFood([Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]);
          } else {
            newSnake.pop(); 
          }
          return newSnake;
        });
      }, speed);
    }
    return () => clearInterval(moveId);
  }, [isPlaying, gameOver, food, selectedGame, difficulty]);

  useEffect(() => {
    if (gameOver && selectedGame === 'snake' && !rewardClaimed) {
      setRewardClaimed(true);
      if (score > 0) {
        const pts = Math.floor(score / 10);
        addMiniGamePoints(pts);
      }
      saveRecord('Snake', score);
    }
  }, [gameOver, selectedGame, score, rewardClaimed]);

  const changeDirection = (newDir) => {
    if (processedTurnRef.current) return;
    const [nx, ny] = newDir;
    const [cx, cy] = directionRef.current;
    if (nx === -cx && ny === -cy) return; // Prevent 180 turn
    setDirection(newDir);
    directionRef.current = newDir;
    processedTurnRef.current = true;
  };

  const changeDir = (dx, dy) => {
    // prevent reverse
    const cur = directionRef.current;
    if (cur[0] === -dx && cur[1] === -dy) return;
    directionRef.current = [dx, dy];
  };

  // --- GUESS NUMBER LOGIC ---
  const startGuessGame = () => {
    setTargetNumber(Math.floor(Math.random() * 101));
    setGuessHistory([]);
    setGuessInput('');
    const tr = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 7 : 5;
    setTriesLeft(tr);
    setGuessGameOver(false);
    setIsReady(true);
  };

  const submitGuess = () => {
    if (guessGameOver || guessInput === '') return;
    const num = parseInt(guessInput, 10);
    if (isNaN(num)) return;

    let msg = '';
    let isWin = false;

    if (num === targetNumber) {
      msg = 'Chính xác! 🎉';
      isWin = true;
    } else if (num < targetNumber) {
      msg = `Vượt ${num} lên một chút! 🔺`;
    } else {
      msg = `Giảm từ ${num} xuống một chút! 🔻`;
    }

    const newHistory = [...guessHistory, { guess: num, msg, isWin }];
    setGuessHistory(newHistory);
    setGuessInput('');

    if (isWin) {
      setGuessGameOver(true);
      setIsGameFinished(true);
      if (!rewardClaimed) {
        setRewardClaimed(true);
        const tr = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 7 : 5;
        const pts = (tr - triesLeft + 1) <= 2 ? 15 : 5;
        addMiniGamePoints(pts);
        saveRecord('Đoán Số', 100 - (tr - triesLeft) * 10);
      }
    } else {
      if (triesLeft - 1 <= 0) {
        setGuessGameOver(true);
        setIsGameFinished(true);
        setGuessHistory([...newHistory, { guess: null, msg: `THUA CUỘC! Số mục tiêu là ${targetNumber}`, isWin: false }]);
        if(!rewardClaimed) { setRewardClaimed(true); saveRecord('Đoán Số', 0); }
      } else {
        setTriesLeft(t => t - 1);
      }
    }
  };

  // --- WHACK-A-MOLE LOGIC ---
  const startMoleGame = () => {
    setMoles(Array(9).fill(false));
    setMoleScore(0);
    const tm = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15;
    setMoleTimeLeft(tm);
    setMolePlaying(true);
    setMoleGameOver(false);
    setIsReady(true);
  };

  useEffect(() => {
    let moleInterval;
    if (molePlaying && !moleGameOver && selectedGame === 'mole') {
      moleInterval = setInterval(() => {
        setMoleTimeLeft(prev => {
          if (prev <= 1) {
            endMoleGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(moleInterval);
  }, [molePlaying, moleGameOver, selectedGame]);

  useEffect(() => {
    let spawnInterval;
    if (molePlaying && !moleGameOver && selectedGame === 'mole') {
      const spawnRate = difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 800 : 500;
      const stayTime = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1000 : 700;

      spawnInterval = setInterval(() => {
        const index = Math.floor(Math.random() * 9);
        setMoles(prev => {
          if (prev[index]) return prev; // Already a mole there
          const next = [...prev];
          next[index] = true;
          
          // Set timeout to remove this specific mole
          setTimeout(() => {
            setMoles(curr => {
              const updated = [...curr];
              updated[index] = false;
              return updated;
            });
          }, stayTime);
          
          return next;
        });
      }, spawnRate);
    }
    return () => clearInterval(spawnInterval);
  }, [molePlaying, moleGameOver, selectedGame, difficulty]);

  const endMoleGame = () => {
    setMoleGameOver(true);
    setMolePlaying(false);
    setIsGameFinished(true);
  };

  const whackMole = (index) => {
    if (!molePlaying || moleGameOver) return;
    if (moles[index]) {
      playSound('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setMoleScore(s => s + 5);
      // Remove mole immediately upon whack to feel responsive
      setMoles(prev => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
    }
  };

  useEffect(() => {
    if (moleGameOver && selectedGame === 'mole' && !rewardClaimed) {
      setRewardClaimed(true);
      if(moleScore > 0) {
        addMiniGamePoints(Math.floor(moleScore / 5));
      }
      saveRecord('Đập Chuột', moleScore);
    }
  }, [moleGameOver, selectedGame, moleScore, rewardClaimed]);

  // --- MEMORY MATCH LOGIC ---
  const startMemoryGame = () => {
    const pairsCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
    const selectedEmojis = MEMORY_EMOJIS.slice(0, pairsCount);
    const deck = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlippedIndex([]);
    setMatchedPairs([]);
    const tm = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 30 : 25;
    setMemoryTimeLeft(tm);
    setMemoryPlaying(true);
    setMemoryGameOver(false);
    setIsReady(true);
  };

  useEffect(() => {
    let timerId;
    if (memoryPlaying && !memoryGameOver && selectedGame === 'memory') {
      timerId = setInterval(() => {
        setMemoryTimeLeft(prev => {
          if (prev <= 1) {
            endMemoryGame(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [memoryPlaying, memoryGameOver, selectedGame]);

  const handleCardClick = (index) => {
    if (flippedIndex.length === 2 || matchedPairs.includes(index) || flippedIndex.includes(index) || memoryGameOver) return;
    playSound('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
    const newFlipped = [...flippedIndex, index];
    setFlippedIndex(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        playSound('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        const newMatched = [...matchedPairs, newFlipped[0], newFlipped[1]];
        setMatchedPairs(newMatched);
        setFlippedIndex([]);
        if (newMatched.length === cards.length) {
          endMemoryGame(true);
        }
      } else {
        setTimeout(() => setFlippedIndex([]), 800);
      }
    }
  };

  const endMemoryGame = (win) => {
    setMemoryGameOver(true);
    setMemoryPlaying(false);
    setIsGameFinished(true);
    if (!rewardClaimed) {
      setRewardClaimed(true);
      if(win) {
        addMiniGamePoints(15);
        saveRecord('Lật Hình', 100 + memoryTimeLeft * 5);
      } else {
        saveRecord('Lật Hình', matchedPairs.length * 5);
      }
    }
  };

  if (!isOpen) return null;

  const padStyle = { background: '#334155', border: 'none', padding: '15px', borderRadius: '8px', color: '#fff', cursor: 'pointer' };

  return (
    <div className="overlay overlay-slot" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{ width: '95%', maxWidth: selectedGame === 'snake' ? '450px' : '400px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative', textAlign: 'center', background: '#0f172a' }}
      >
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(selectedGame && !isReady && !isGameFinished) || (isPractice && selectedGame) && (
              <button onClick={() => setSelectedGame(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 style={{ color: '#fff' }}>
              {isPractice ? '🎮 Luyện Tập' : (selectedGame ? 'Chơi Game Giải Trí' : 'Kho Mini Games')}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {(isPractice || !selectedGame || (!isReady && !isGameFinished)) && (
              <>
                <button className="icon-btn" onClick={() => setShowHelp(true)} style={{ width: '32px', height: '32px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <HelpCircle size={18} color="#f59e0b" />
                </button>
                <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
              </>
            )}
          </div>
        </div>

        {showHelp && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>📘 Hướng dẫn luật chơi</h3>
            <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '15px', lineHeight: '1.4' }}>
              Hoàn thành các ván mini-game để nhận <strong>Năng Lượng</strong>. <br/>
              Tích đủ 100 điểm để nhận <strong>Rương Báu</strong>!
            </p>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(245, 158, 11, 0.2)', width: '100%' }}>
              <p style={{ color: '#f59e0b', fontSize: '0.85rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>⚡️ Hệ số Năng Lượng:</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fff' }}>
                <span>Dễ: x1</span>
                <span>Trung bình: x2</span>
                <span>Khó: x4</span>
              </div>
            </div>
            <ul style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left', paddingLeft: '20px', marginBottom: '15px' }}>
              <li>Snake: Mỗi 10 điểm = 1đ năng lượng</li>
              <li>Đoán số/Lật bài: Hoàn thành sớm nhận tới 15đ</li>
              <li>Đập chuột: Mỗi con = 0.5đ năng lượng</li>
            </ul>
            <button onClick={() => setShowHelp(false)} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Đã hiểu</button>
          </div>
        )}

        {!selectedGame && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 15px', marginBottom: '1rem' }}>
            <span style={{ color: '#94a3b8' }}>Độ khó:</span>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '5px', borderRadius: '4px', outline: 'none' }}>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        )}

        {selectedGame && !isReady && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {selectedGame === 'snake' ? '🐍' : selectedGame === 'guess' ? '🔢' : selectedGame === 'mole' ? '🔨' : selectedGame === 'cups' ? '🦆' : '🎴'}
            </div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>
              {selectedGame === 'snake' ? 'Rắn Săn Mồi' : selectedGame === 'guess' ? 'Đoán Số' : selectedGame === 'mole' ? 'Đập Chuột' : selectedGame === 'cups' ? 'Thử Thách Tìm Vịt' : 'Lật Thẻ Bài'}
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Bạn đã sẵn sàng chưa?</p>
            <button 
              onClick={async () => {
                try {
                  if (!isPractice) {
                    await axios.post(import.meta.env.VITE_API_BASE_URL + `/api/wheel/consume-mini-game/${username}`);
                  }
                  if (selectedGame === 'snake') startSnakeGame();
                  else if (selectedGame === 'guess') startGuessGame();
                  else if (selectedGame === 'mole') startMoleGame();
                  else if (selectedGame === 'memory') startMemoryGame();
                  else if (selectedGame === 'cups') startCupsGame();
                } catch(e) {
                  alert("Lỗi lượt chơi!");
                  onClose();
                }
              }}
              style={{ padding: '1rem 3rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}
            >
              BẮT ĐẦU
            </button>
          </div>
        )}

        {!selectedGame && !isGameFinished && (
          <div style={{ padding: '1rem' }}>
            <button 
              className="login-btn" 
              style={{ width: '100%', marginBottom: '1rem', background: 'linear-gradient(to right, #10b981, #059669)', padding: '1rem', borderRadius: '12px', fontSize: '1.2rem', gap: '10px', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => { setSelectedGame('snake'); }}
            >
              🐍 Rắn Săn Mồi
            </button>

            <button 
              className="login-btn" 
              style={{ width: '100%', background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '1rem', borderRadius: '12px', fontSize: '1.2rem', gap: '10px', marginBottom: '1rem', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => { setSelectedGame('guess'); }}
            >
              🔢 Đoán Số Trúng Quà
            </button>

            <button 
              className="login-btn" 
              style={{ width: '100%', background: 'linear-gradient(to right, #f59e0b, #d97706)', padding: '1rem', borderRadius: '12px', fontSize: '1.2rem', gap: '10px', marginBottom: '1rem', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => { setSelectedGame('mole'); }}
            >
              🔨 Đập Chuột Nhận Quà
            </button>

            <button 
              className="login-btn" 
              style={{ width: '100%', background: 'linear-gradient(to right, #ec4899, #be185d)', padding: '1rem', borderRadius: '12px', fontSize: '1.2rem', gap: '10px', marginBottom: '1rem', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => { setSelectedGame('memory'); }}
            >
              🎴 Lật Thẻ Bài Trí Tuệ
            </button>

            <button 
              className="login-btn" 
              style={{ width: '100%', background: 'linear-gradient(to right, #fbbf24, #d97706)', padding: '1rem', borderRadius: '12px', fontSize: '1.2rem', gap: '10px', marginBottom: '1rem', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => { setSelectedGame('cups'); }}
            >
              🦆 Thử Thách Tìm Vịt
            </button>
          </div>
        )}

        {isGameFinished && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏁</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>TRÒ CHƠI KẾT THÚC</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Bạn đã hoàn thành lượt chơi mini-game của mình.</p>
            <button 
              onClick={onClose}
              style={{ padding: '0.8rem 2rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              VỀ VÒNG QUAY
            </button>
          </div>
        )}

        {/* --- SNAKE GAME VIEW --- */}
        {selectedGame === 'snake' && isReady && (
          <div>
            <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>🐍 Rắn Săn Mồi</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '1rem', padding: '0 10px' }}>
              <span>Thời gian: <strong>{timeLeft}s</strong></span>
              <span>Điểm: <strong style={{ color: '#fbbf24' }}>{score}</strong></span>
            </div>

            <div style={{ background: '#1e293b', width: '100%', aspectRatio: '1/1', border: '2px solid #334155', position: 'relative' }}>
              {snake.map((segment, idx) => (
                <div key={idx} style={{ 
                  position: 'absolute', 
                  left: `${(segment[0] / GRID_SIZE) * 100}%`, 
                  top: `${(segment[1] / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  background: idx === 0 ? '#10b981' : '#34d399',
                  borderRadius: '2px'
                }} />
              ))}
              <div style={{ 
                  position: 'absolute', 
                  left: `${(food[0] / GRID_SIZE) * 100}%`, 
                  top: `${(food[1] / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  background: '#ef4444',
                  borderRadius: '50%'
              }} />

              {gameOver && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ color: '#fff', fontSize: '2rem' }}>HẾT GIỜ!</h3>
                  <p style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '1rem' }}>Điểm của bạn: {score}</p>
                  {score > 0 && <p style={{ color: '#10b981' }}>Quà đã được gửi vào túi!</p>}
                </div>
              )}
            </div>

            {/* D-PAC Refined */}
            {!gameOver && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {(direction[1] !== 0) ? ( // Moving up or down
                    <>
                      <button onClick={() => changeDirection([-1, 0])} style={padStyle}><ArrowLeft size={24} /></button>
                      <button onClick={() => changeDirection([1, 0])} style={padStyle}><ArrowRight size={24} /></button>
                    </>
                  ) : ( // Moving left or right
                    <>
                      <button onClick={() => changeDirection([0, -1])} style={padStyle}><ArrowUp size={24} /></button>
                      <button onClick={() => changeDirection([0, 1])} style={padStyle}><ArrowDown size={24} /></button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- GUESS NUMBER VIEW --- */}
        {selectedGame === 'guess' && isReady && (
          <div>
            <h2 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>🔢 Đoán Số Trúng Quà</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Tôi đang nghĩ 1 số từ 0 đến 100. Bạn có {triesLeft} lượt!</p>

            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem', background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
              {guessHistory.map((item, idx) => (
                <div key={idx} style={{ 
                  color: item.isWin ? '#10b981' : (item.guess === null ? '#ef4444' : '#fcd34d'),
                  marginBottom: '5px' 
                }}>
                  {item.guess !== null && <strong>[{item.guess}] </strong>} 
                  {item.msg}
                </div>
              ))}
              {guessHistory.length === 0 && <p style={{ color: '#64748b' }}>Chưa có dự đoán nào...</p>}
            </div>

            {!guessGameOver ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Nhập số..."
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '1.2rem' }}
                />
                <button 
                  onClick={submitGuess}
                  style={{ padding: '0 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
                >
                  ĐOÁN
                </button>
              </div>
            ) : (
              <button 
                onClick={onClose}
                style={{ width: '100%', padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}
              >
                KẾT THÚC
              </button>
            )}
          </div>
        )}

        {/* --- WHACK A MOLE VIEW --- */}
        {selectedGame === 'mole' && (
          <div>
            <h2 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>🔨 Đập Chuột</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '1rem', padding: '0 10px' }}>
              <span>Thời gian: <strong>{moleTimeLeft}s</strong></span>
              <span>Điểm: <strong style={{ color: '#fbbf24' }}>{moleScore}</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '2px solid #334155', position: 'relative' }}>
              {moles.map((isMole, idx) => (
                <div 
                  key={idx} 
                  onClick={() => whackMole(idx)}
                  style={{ 
                    aspectRatio: '1/1', 
                    background: '#0f172a', 
                    borderRadius: '50%',
                    border: '4px solid #334155',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: (molePlaying && isMole) ? 'pointer' : 'default',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <AnimatePresence>
                    {isMole && (
                      <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                      >
                        🐹
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {moleGameOver && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <h3 style={{ color: '#fff', fontSize: '2rem' }}>HẾT GIỜ!</h3>
                  <p style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '1rem' }}>Điểm của bạn: {moleScore}</p>
                  {moleScore > 0 ? <p style={{ color: '#10b981' }}>Đã lưu quà đập chuột!</p> : <p style={{ color: '#94a3b8' }}>Bạn chưa đập trúng con nào!</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MEMORY GAME VIEW --- */}
        {selectedGame === 'memory' && isReady && (
          <div>
            <h2 style={{ color: '#ec4899', marginBottom: '0.5rem' }}>🎴 Lật Thẻ Bài</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '1rem', padding: '0 10px' }}>
              <span>Thời gian: <strong>{memoryTimeLeft}s</strong></span>
              <span>Đã lật: <strong style={{ color: '#fbbf24' }}>{matchedPairs.length / 2} / 6</strong> cặp</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '2px solid #334155', position: 'relative' }}>
              {cards.map((card, idx) => {
                const isFlipped = flippedIndex.includes(idx) || matchedPairs.includes(idx);
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleCardClick(idx)}
                    style={{ 
                      aspectRatio: '3/4', 
                      background: isFlipped ? '#f8fafc' : 'linear-gradient(135deg, #ec4899, #be185d)', 
                      borderRadius: '8px',
                      border: '2px solid #cbd5e1',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '2rem',
                      cursor: (!memoryPlaying || isFlipped) ? 'default' : 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                      transition: 'transform 0.3s',
                      transform: isFlipped ? 'rotateY(0)' : 'rotateY(180deg)'
                    }}
                  >
                    <span style={{ opacity: isFlipped ? 1 : 0, transition: 'opacity 0.2s' }}>{card}</span>
                  </div>
                );
              })}

              {memoryGameOver && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <h3 style={{ color: matchedPairs.length === cards.length ? '#10b981' : '#ef4444', fontSize: '2rem', marginBottom: '10px', textAlign: 'center' }}>
                    {matchedPairs.length === cards.length ? 'THẮNG!' : 'HẾT GIỜ!'}
                  </h3>
                  {matchedPairs.length === cards.length && <p style={{ color: '#fbbf24', fontSize: '1.2rem' }}>Đã nhận quà Siêu trí tuệ!</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CUPS GAME VIEW --- */}
        {selectedGame === 'cups' && isReady && (
          <div>
            <h2 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>🦆 Thử Thách Tìm Vịt</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              {isShuffling ? `Đang xáo trộn: ${shuffleTimeLeft}s` : (revealed && !cupsGameOver ? 'Hãy nhớ vị trí con vịt!' : (revealed ? 'Kết quả!' : 'Tìm con vịt!'))}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', height: '160px', alignItems: 'flex-end', marginBottom: '1.5rem', position: 'relative' }}>
              {[0, 1, 2].map(posIdx => {
                const cupIdx = cups[posIdx];
                const hasDuck = (cupIdx === duckPos);
                // Hiệu ứng nhấc bát lên khi đang ở mode hiển thị trước hoặc kết thúc
                const isLifted = revealed && hasDuck; 

                return (
                  <motion.div 
                    key={cupIdx}
                    layout
                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                    onClick={() => handleCupClick(cupIdx)}
                    style={{ position: 'relative', cursor: (isShuffling || revealed) ? 'default' : 'pointer' }}
                  >
                     {/* Duck inside */}
                     <AnimatePresence>
                        {hasDuck && (
                          <div style={{ 
                            fontSize: '3rem', 
                            position: 'absolute', 
                            bottom: '10px', 
                            left: '10px', 
                            zIndex: 1,
                            opacity: (revealed && hasDuck) ? 1 : 0,
                            transition: 'opacity 0.3s'
                          }}>🦆</div>
                        )}
                     </AnimatePresence>

                     {/* The Cup/Bowl (Now Upside Down) */}
                     <motion.div
                       animate={{ y: isLifted ? -70 : 0 }}
                       style={{ 
                          width: '80px', 
                          height: '70px', 
                          background: '#475569', 
                          borderRadius: '40px 40px 4px 4px', // Round top, flat bottom
                          border: '4px solid #334155',
                          position: 'relative',
                          zIndex: 2,
                          boxShadow: isLifted ? '0 20px 25px rgba(0,0,0,0.5)' : '0 5px 10px rgba(0,0,0,0.3)'
                       }}
                     >
                        {/* Lip of the bowl at the bottom */}
                        <div style={{ width: 'calc(100% + 12px)', height: '8px', background: '#1e293b', position: 'absolute', bottom: '-4px', left: '-6px', borderRadius: '4px' }}></div>
                     </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {!isShuffling && !cupsGameOver && revealed && (
              <button 
                onClick={startShuffling}
                style={{ width: '100%', padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(16,185,129,0.3)' }}
              >
                BẮT ĐẦU XÁO TRỘN
              </button>
            )}

            {revealed && cupsGameOver && (
              <div style={{ marginTop: '1rem' }}>
                 <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>XÁC NHẬN & ĐÓNG</button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const padStyle = {
  width: '50px', height: '50px', 
  borderRadius: '50%',
  border: 'none',
  background: '#334155', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
};

export default MiniGameModal;
