import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import SmartFeatures from './pages/SmartFeatures/SmartFeatures';
import AIChat from './pages/AIChat/AIChat';
import Profile from './pages/Profile/Profile';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào trang Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/smart-features" element={<SmartFeatures />} />
        <Route path="/ai-assistant" element={<AIChat />} />
        <Route path="/profile" element={<Profile />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
