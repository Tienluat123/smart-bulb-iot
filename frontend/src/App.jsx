import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';

// Tạo tạm component Dashboard rỗng để test chuyển trang
const DashboardPlaceholder = () => <h1 style={{textAlign:'center', marginTop: '50px'}}>🏡 Đây là Dashboard (Đang xây dựng)</h1>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào trang Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
