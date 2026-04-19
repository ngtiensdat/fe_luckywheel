import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import LuckyWheel from './components/LuckyWheel';
import AdminPanel from './components/AdminPanel';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  const hasUser = !!localStorage.getItem('username');
  return (isAuth || hasUser) ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/wheel" 
            element={
              <ProtectedRoute>
                <LuckyWheel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
