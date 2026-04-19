import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.username === 'admin') {
      if (formData.password === '123456') {
        localStorage.setItem("username", "admin");
        navigate('/admin');
      } else {
        alert("Sai mật khẩu Admin!");
      }
      return;
    }
    
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + '/api/users/login',
        formData
      );

      if (response.status === 200) {
        localStorage.setItem('username', response.data.username);
        navigate('/wheel');
      }
    } catch (error) {
      if (error.response) {
        // Server phản hồi với mã lỗi (ví dụ: 401, 400)
        alert('Đăng nhập thất bại: ' + (error.response.data || 'Thông tin không chính xác'));
      } else {
        console.error('Lỗi kết nối Backend:', error);
        alert('Không thể kết nối tới Server Java. Hãy đảm bảo bạn đã chạy dự án trong IntelliJ!');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass-card"
      >
        <div className="header">
          <h1>Welcome Back</h1>
          <p>Please enter your details to sign in</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username or Email</label>
            <div className="input-wrapper">
              <User size={18} />
              <input 
                type="text" 
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="login-btn"
            type="submit"
          >
            Sign In <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
          </motion.button>
        </form>

        <div className="footer-text">
          <p>Don't have an account? <a href="#">Create account</a></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
