import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiSliders, FiBarChart2, FiCpu, FiLogOut } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="logo-area">
                <h2>HappyHue</h2>
            </div>

            <nav className="nav-links">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FiHome className="icon" /> Dashboard
                </NavLink>
                <NavLink to="/control" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FiSliders className="icon" /> Điều khiển
                </NavLink>
                <NavLink to="/stats" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FiBarChart2 className="icon" /> Thống kê
                </NavLink>
                <NavLink to="/assistant" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FiCpu className="icon" /> Trợ lý AI
                </NavLink>
            </nav>

            <div className="logout-area">
                <button onClick={handleLogout} className="logout-btn">
                    <FiLogOut className="icon" /> Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
