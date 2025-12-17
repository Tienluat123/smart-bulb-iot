// import { useState, useEffect } from 'react';
// import Sidebar from '../../components/Sidebar/Sidebar';
// import { useSocketConnection } from '../../hooks/useSocketConnection'; // <--- Hook mới
// import { useSocketAlarm } from '../../hooks/useSocketAlarm';
// import { usePomodoro } from '../../hooks/usePomodoro';

// import './SmartFeatures.css'; 

// const SmartFeatures = () => {
//     // 1. Khởi tạo KẾT NỐI DUY NHẤT (Shared Socket)
//     const socket = useSocketConnection(); 
    
//     // 2. Truyền socket đó cho các tính năng con
//     const { alarm, saveAlarm } = useSocketAlarm(socket);
//     const { pomoTime, pomoActive, formatTime, togglePomodoro, resetPomodoro } = usePomodoro(0.3, socket);
    
//     // 3. Logic User Name (Giữ nguyên)
//     const [userName, setUserName] = useState('Admin');
//     useEffect(() => {
//         const storedUser = localStorage.getItem('userInfo');
//         if (storedUser) {
//             try {
//                 const userObj = JSON.parse(storedUser);
//                 setUserName(userObj.fullname || userObj.username || 'Admin');
//             } catch (e) {
//                 // setUserName('Admin');
//                 console.error('Lỗi phân tích thông tin người dùng từ localStorage', e);
//             }
//         }
//     }, []);

//     return (
//         <div className="dashboard-layout">
//             <Sidebar />
//             <main className="main-content">
//                 <div className="header-section">
//                     <h1>Tiện ích thông minh 🛠️</h1>
//                     <p>Xin chào, {userName}! Quản lý thời gian và báo thức của bạn.</p>
//                 </div>

//                 <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
                    
//                     {/* WIDGET 1: BÁO THỨC */}
//                     <div className="feature-card">
//                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
//                             <h3 style={{ margin: 0, color: '#333' }}>Báo thức</h3>
//                             <label className="switch">
//                                 <input 
//                                     type="checkbox" 
//                                     checked={alarm.is_active}
//                                     onChange={(e) => saveAlarm(alarm.time, e.target.checked)}
//                                 />
//                                 <span className="slider round"></span>
//                             </label>
//                         </div>

//                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                             <input 
//                                 type="time" 
//                                 value={alarm.time || "07:00"}
//                                 onChange={(e) => saveAlarm(e.target.value, alarm.is_active)}
//                                 style={{
//                                     fontSize: '56px', fontFamily: 'monospace', border: 'none',
//                                     background: '#f0f2f5', padding: '10px 30px', borderRadius: '20px',
//                                     color: alarm.is_active ? '#078080' : '#aaa',
//                                     outline: 'none', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
//                                 }}
//                             />
//                             <p style={{ marginTop: '20px', color: '#666' }}>
//                                 {alarm.is_active ? `Sẽ reng lúc ${alarm.time}` : 'Báo thức đang tắt'}
//                             </p>
//                         </div>
//                     </div>

//                     {/* WIDGET 2: POMODORO */}
//                     <div className="feature-card">
//                         <h3 style={{ margin: 0, marginBottom: '25px', color: '#333' }}>Pomodoro Focus</h3>
                        
//                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                             <div style={{
//                                 width: '160px', height: '160px', borderRadius: '50%',
//                                 border: `8px solid ${pomoActive ? '#f45d48' : '#e0e0e0'}`,
//                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                 fontSize: '42px', fontWeight: 'bold', color: '#333', marginBottom: '25px',
//                                 transition: 'border 0.3s ease'
//                             }}>
//                                 {formatTime(pomoTime)}
//                             </div>

//                             <div style={{ display: 'flex', gap: '15px' }}>
//                                 <button 
//                                     onClick={togglePomodoro}
//                                     style={{
//                                         padding: '12px 28px', borderRadius: '10px', border: 'none',
//                                         background: pomoActive ? '#ffebee' : '#078080',
//                                         color: pomoActive ? '#f45d48' : 'white',
//                                         fontWeight: 'bold', cursor: 'pointer', fontSize: '16px'
//                                     }}
//                                 >
//                                     {pomoActive ? '⏸ Tạm dừng' : '▶ Bắt đầu'}
//                                 </button>
                                
//                                 <button 
//                                     onClick={resetPomodoro}
//                                     style={{
//                                         padding: '12px 20px', borderRadius: '10px',
//                                         border: '1px solid #ddd', background: 'white',
//                                         color: '#666', cursor: 'pointer', fontSize: '16px'
//                                     }}
//                                 >
//                                     ↺ Reset
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default SmartFeatures;


import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { useSocketAlarm } from '../../hooks/useSocketAlarm';
import './SmartFeatures.css';

const SmartFeatures = () => {
    const socket = useSocketConnection(); 
    const { alarm, saveAlarm } = useSocketAlarm(socket);
    
    const [pomodoros, setPomodoros] = useState(() => {
        // Khôi phục từ localStorage khi khởi tạo
        const saved = localStorage.getItem('pomodoros');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Lỗi khôi phục pomodoros:', e);
            }
        }
        return [{ id: 1, name: 'Học bài', duration: 25, isActive: false, timeLeft: 25 * 60, isBreak: false }];
    });
    const [editingId, setEditingId] = useState(null);
    const [newPomoName, setNewPomoName] = useState('');
    const [newPomoDuration, setNewPomoDuration] = useState(25);
    const [userName, setUserName] = useState('Admin');
    
    // Lưu pomodoros vào localStorage mỗi khi thay đổi
    useEffect(() => {
        localStorage.setItem('pomodoros', JSON.stringify(pomodoros));
    }, [pomodoros]);
    
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                setUserName(userObj.fullname || userObj.username || 'Admin');
            } catch (e) {
                console.error('Lỗi phân tích thông tin người dùng từ localStorage', e);
            }
        }
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setPomodoros(prev => prev.map(pomo => {
                if (!pomo.isActive) return pomo;
                
                if (pomo.timeLeft > 0) {
                    return { ...pomo, timeLeft: pomo.timeLeft - 1 };
                } else {
                    triggerBuzzer(pomo.isBreak ? 'break_end' : 'work_end');
                    
                    if (pomo.isBreak) {
                        return {
                            ...pomo,
                            isActive: false,
                            isBreak: false,
                            timeLeft: pomo.duration * 60
                        };
                    } else {
                        return {
                            ...pomo,
                            isBreak: true,
                            timeLeft: 5 * 60
                        };
                    }
                }
            }));
        }, 1000);
        
        return () => clearInterval(interval);
    }, [socket]);
    
    const triggerBuzzer = (type, pomoName, duration) => {
        console.log(`🔔 Gửi tín hiệu đến buzzer: ${type} - ${pomoName}`);
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Gửi theo chuẩn WebSocket (socket.send)
            socket.send(JSON.stringify({
                type: 'BUZZER',
                action: type,
                source: 'pomodoro',
                pomoName: pomoName,
                timestamp: new Date().toISOString()
            }));
            
            console.log(`✅ Đã gửi tín hiệu buzzer qua WebSocket`);
        } else if (socket && typeof socket.emit === 'function') {
            // Nếu socket sử dụng Socket.IO (socket.emit)
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
                try {
                    const userObj = JSON.parse(storedUser);
                    const deviceId = userObj.device_id || userObj.deviceId;
                    
                    if (deviceId) {
                        socket.emit('pomodoro_finished', { 
                            deviceId: deviceId,
                            duration: duration || 25,
                            pomoName: pomoName,
                            action: type
                        });
                        console.log(`✅ Đã gửi tín hiệu buzzer qua Socket.IO cho thiết bị: ${deviceId}`);
                    }
                } catch (e) {
                    console.error('❌ Lỗi parse userInfo:', e);
                }
            }
        } else {
            console.warn('⚠️ Socket chưa kết nối - không thể gửi tín hiệu buzzer');
        }
        
        // Hiển thị thông báo cho user
        if (type === 'work_end') {
            alert(`⏰ Hoàn thành: ${pomoName}!\n\n🎉 Bắt đầu giải lao 5 phút.`);
        } else if (type === 'break_end') {
            alert(`☕ Hết giờ giải lao!\n\n💪 Sẵn sàng làm việc tiếp.`);
        }
    };
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const togglePomodoro = (id) => {
        setPomodoros(prev => prev.map(pomo => {
            if (pomo.id !== id) return pomo;
            
            if (pomo.isActive) {
                // ĐANG CHẠY -> DỪNG
                return { 
                    ...pomo, 
                    isActive: false,
                    targetTime: null
                };
            } else {
                // ĐANG DỪNG -> BẬT
                const now = Date.now();
                const duration = pomo.isBreak ? 5 : pomo.duration; // Giải lao 5 phút, làm việc theo duration
                const targetTime = now + duration * 60 * 1000;
                
                return { 
                    ...pomo, 
                    isActive: true,
                    targetTime: targetTime,
                    timeLeft: duration * 60
                };
            }
        }));
    };
    
    const resetPomodoro = (id) => {
        setPomodoros(prev => prev.map(pomo => 
            pomo.id === id ? { 
                ...pomo, 
                isActive: false, 
                isBreak: false,
                timeLeft: pomo.duration * 60,
                targetTime: null
            } : pomo
        ));
    };
    
    const addPomodoro = () => {
        if (!newPomoName.trim()) return;
        
        const newPomo = {
            id: Date.now(),
            name: newPomoName,
            duration: newPomoDuration,
            isActive: false,
            timeLeft: newPomoDuration * 60,
            isBreak: false
        };
        
        setPomodoros([...pomodoros, newPomo]);
        setNewPomoName('');
        setNewPomoDuration(25);
    };
    
    const deletePomodoro = (id) => {
        setPomodoros(prev => prev.filter(pomo => pomo.id !== id));
    };
    
    const updatePomodoro = (id, name, duration) => {
        setPomodoros(prev => prev.map(pomo => 
            pomo.id === id ? { 
                ...pomo, 
                name, 
                duration, 
                timeLeft: pomo.isActive ? pomo.timeLeft : duration * 60 
            } : pomo
        ));
        setEditingId(null);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            
            <main className="main-content" style={{ 
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                minHeight: '100vh'
            }}>
                {/* Header */}
                <div style={{ 
                    marginBottom: '40px',
                    padding: '30px',
                    background: 'linear-gradient(135deg, #078080 0%, #05a5a5 100%)',
                    borderRadius: '24px',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(7, 128, 128, 0.3)'
                }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
                        ⚡ Tiện ích thông minh
                    </h1>
                    <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
                        Xin chào, {userName}! Quản lý thời gian và năng suất của bạn.
                    </p>
                </div>

                {/* SECTION 1: BÁO THỨC */}
                <div style={{ marginBottom: '50px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '20px',
                        paddingLeft: '10px'
                    }}>
                        <div style={{
                            width: '6px',
                            height: '32px',
                            background: 'linear-gradient(180deg, #078080 0%, #05a5a5 100%)',
                            borderRadius: '3px'
                        }}></div>
                        <h2 style={{ 
                            fontSize: '28px', 
                            fontWeight: 'bold', 
                            color: '#1a1a1a',
                            margin: 0
                        }}>
                            🔔 Báo thức
                        </h2>
                    </div>

                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(7, 128, 128, 0.1)',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            marginBottom: '35px',
                            paddingBottom: '20px',
                            borderBottom: '2px solid #f0f2f5'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '22px', color: '#333', marginBottom: '6px' }}>
                                    Đặt giờ thức dậy
                                </h3>
                                <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                                    Nhận thông báo vào thời gian bạn chọn
                                </p>
                            </div>
                            <label className="switch" style={{ transform: 'scale(1.2)' }}>
                                <input 
                                    type="checkbox" 
                                    checked={alarm.is_active}
                                    onChange={(e) => saveAlarm(alarm.time, e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            padding: '20px 0'
                        }}>
                            <input 
                                type="time" 
                                value={alarm.time || "07:00"}
                                onChange={(e) => saveAlarm(e.target.value, alarm.is_active)}
                                style={{
                                    fontSize: '72px',
                                    fontFamily: 'monospace',
                                    border: 'none',
                                    background: alarm.is_active 
                                        ? 'linear-gradient(135deg, #e8f5f5 0%, #d1eded 100%)' 
                                        : '#f8f9fa',
                                    padding: '20px 50px',
                                    borderRadius: '24px',
                                    color: alarm.is_active ? '#078080' : '#ccc',
                                    outline: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    boxShadow: alarm.is_active 
                                        ? '0 8px 20px rgba(7, 128, 128, 0.2)' 
                                        : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <div style={{ 
                                marginTop: '30px',
                                padding: '12px 30px',
                                background: alarm.is_active ? '#e8f5e9' : '#f5f5f5',
                                borderRadius: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '20px' }}>
                                    {alarm.is_active ? '✅' : '⏸️'}
                                </span>
                                <p style={{ margin: 0, color: alarm.is_active ? '#2e7d32' : '#666', fontSize: '16px', fontWeight: '500' }}>
                                    {alarm.is_active ? `Sẽ reng lúc ${alarm.time}` : 'Báo thức đang tắt'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: POMODORO */}
                <div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '20px',
                        paddingLeft: '10px'
                    }}>
                        <div style={{
                            width: '6px',
                            height: '32px',
                            background: 'linear-gradient(180deg, #f45d48 0%, #ff6f61 100%)',
                            borderRadius: '3px'
                        }}></div>
                        <h2 style={{ 
                            fontSize: '28px', 
                            fontWeight: 'bold', 
                            color: '#1a1a1a',
                            margin: 0
                        }}>
                            🍅 Pomodoro Focus
                        </h2>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                        gap: '24px'
                    }}>
                        {/* Pomodoro Timers */}
                        {pomodoros.map(pomo => (
                            <div key={pomo.id} style={{
                                background: 'white',
                                borderRadius: '20px',
                                padding: '28px',
                                boxShadow: pomo.isActive 
                                    ? '0 12px 28px rgba(244, 93, 72, 0.25)' 
                                    : '0 6px 20px rgba(0,0,0,0.08)',
                                border: pomo.isActive 
                                    ? '2px solid #f45d48' 
                                    : '1px solid rgba(0,0,0,0.06)',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Gradient overlay khi active */}
                                {pomo.isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: pomo.isBreak 
                                            ? 'linear-gradient(90deg, #4CAF50, #81C784)'
                                            : 'linear-gradient(90deg, #f45d48, #ff6f61)'
                                    }}></div>
                                )}

                                {editingId === pomo.id ? (
                                    <div style={{ marginBottom: '20px' }}>
                                        <input 
                                            type="text"
                                            defaultValue={pomo.name}
                                            id={`name-${pomo.id}`}
                                            placeholder="Tên công việc"
                                            style={{
                                                width: '100%', 
                                                padding: '12px 16px', 
                                                marginBottom: '12px',
                                                border: '2px solid #e0e0e0', 
                                                borderRadius: '12px', 
                                                fontSize: '16px',
                                                boxSizing: 'border-box',
                                                outline: 'none',
                                                transition: 'border 0.2s ease'
                                            }}
                                            onFocus={(e) => e.target.style.border = '2px solid #078080'}
                                            onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
                                        />
                                        <input 
                                            type="number"
                                            defaultValue={pomo.duration}
                                            id={`duration-${pomo.id}`}
                                            min="1"
                                            max="120"
                                            placeholder="Thời gian (phút)"
                                            style={{
                                                width: '100%', 
                                                padding: '12px 16px', 
                                                marginBottom: '12px',
                                                border: '2px solid #e0e0e0', 
                                                borderRadius: '12px', 
                                                fontSize: '16px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => {
                                                    const name = document.getElementById(`name-${pomo.id}`).value;
                                                    const duration = parseInt(document.getElementById(`duration-${pomo.id}`).value);
                                                    updatePomodoro(pomo.id, name, duration);
                                                }}
                                                style={{
                                                    flex: 1, 
                                                    padding: '12px', 
                                                    background: 'linear-gradient(135deg, #078080, #05a5a5)',
                                                    color: 'white',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    cursor: 'pointer', 
                                                    fontWeight: 'bold',
                                                    fontSize: '15px'
                                                }}
                                            >
                                                Lưu
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    flex: 1, 
                                                    padding: '12px', 
                                                    background: '#f5f5f5', 
                                                    color: '#666',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    cursor: 'pointer',
                                                    fontSize: '15px'
                                                }}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        justifyContent: 'space-between', 
                                        marginBottom: '24px' 
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ 
                                                margin: 0, 
                                                fontSize: '20px',
                                                fontWeight: '600',
                                                color: '#1a1a1a',
                                                marginBottom: '6px'
                                            }}>
                                                {pomo.name}
                                            </h3>
                                            <div style={{ 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: '#f8f9fa',
                                                padding: '4px 12px',
                                                borderRadius: '20px'
                                            }}>
                                                <span style={{ fontSize: '11px' }}>⏱️</span>
                                                <span style={{ 
                                                    fontSize: '13px', 
                                                    color: '#666',
                                                    fontWeight: '500'
                                                }}>
                                                    {pomo.duration} phút
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setEditingId(pomo.id)}
                                                disabled={pomo.isActive}
                                                title="Chỉnh sửa"
                                                style={{
                                                    padding: '8px 12px', 
                                                    background: pomo.isActive ? '#f5f5f5' : '#e8f5f5',
                                                    color: pomo.isActive ? '#ccc' : '#078080',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    cursor: pomo.isActive ? 'not-allowed' : 'pointer',
                                                    fontSize: '16px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => deletePomodoro(pomo.id)}
                                                disabled={pomo.isActive}
                                                title="Xóa"
                                                style={{
                                                    padding: '8px 12px', 
                                                    background: pomo.isActive ? '#f5f5f5' : '#ffebee',
                                                    color: pomo.isActive ? '#ccc' : '#f45d48',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    cursor: pomo.isActive ? 'not-allowed' : 'pointer',
                                                    fontSize: '16px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '180px', 
                                        height: '180px', 
                                        borderRadius: '50%',
                                        border: `6px solid ${pomo.isActive ? (pomo.isBreak ? '#4CAF50' : '#f45d48') : '#e8e8e8'}`,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        background: pomo.isActive 
                                            ? (pomo.isBreak 
                                                ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                                                : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)')
                                            : '#fafafa',
                                        fontSize: '42px', 
                                        fontWeight: 'bold', 
                                        color: '#1a1a1a', 
                                        marginBottom: '28px',
                                        transition: 'all 0.4s ease',
                                        boxShadow: pomo.isActive 
                                            ? '0 8px 24px rgba(0,0,0,0.12)' 
                                            : '0 4px 12px rgba(0,0,0,0.06)'
                                    }}>
                                        <div style={{ fontFamily: 'monospace' }}>{formatTime(pomo.timeLeft)}</div>
                                        {pomo.isBreak && (
                                            <div style={{ 
                                                fontSize: '16px', 
                                                color: '#4CAF50', 
                                                marginTop: '8px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                ☕ Giải lao
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                        <button 
                                            onClick={() => togglePomodoro(pomo.id)}
                                            style={{
                                                flex: 1,
                                                padding: '14px 20px', 
                                                borderRadius: '12px', 
                                                border: 'none',
                                                background: pomo.isActive 
                                                    ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                                                    : 'linear-gradient(135deg, #078080 0%, #05a5a5 100%)',
                                                color: pomo.isActive ? '#f45d48' : 'white',
                                                fontWeight: 'bold', 
                                                cursor: 'pointer', 
                                                fontSize: '15px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: pomo.isActive 
                                                    ? 'none'
                                                    : '0 4px 12px rgba(7, 128, 128, 0.3)'
                                            }}
                                        >
                                            {pomo.isActive ? '⏸ Tạm dừng' : '▶ Bắt đầu'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => resetPomodoro(pomo.id)}
                                            style={{
                                                padding: '14px 20px', 
                                                borderRadius: '12px',
                                                border: '2px solid #e8e8e8', 
                                                background: 'white',
                                                color: '#666', 
                                                cursor: 'pointer', 
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            ↺
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Thêm Pomodoro mới */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                            borderRadius: '20px',
                            padding: '28px',
                            border: '2px dashed #d0d0d0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            minHeight: '380px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ 
                                textAlign: 'center',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 16px',
                                    background: 'linear-gradient(135deg, #e8f5f5 0%, #d1eded 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px'
                                }}>
                                    ➕
                                </div>
                                <h3 style={{ 
                                    margin: 0, 
                                    color: '#333',
                                    fontSize: '20px',
                                    fontWeight: '600'
                                }}>
                                    Tạo Pomodoro mới
                                </h3>
                                <p style={{ 
                                    margin: 0, 
                                    marginTop: '8px',
                                    color: '#999',
                                    fontSize: '14px'
                                }}>
                                    Thêm công việc cần tập trung
                                </p>
                            </div>
                            
                            <input 
                                type="text"
                                placeholder="Tên công việc (vd: Học Toán)"
                                value={newPomoName}
                                onChange={(e) => setNewPomoName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addPomodoro()}
                                style={{
                                    width: '100%', 
                                    padding: '14px 18px', 
                                    marginBottom: '16px',
                                    border: '2px solid #e8e8e8', 
                                    borderRadius: '12px', 
                                    fontSize: '15px',
                                    outline: 'none', 
                                    boxSizing: 'border-box',
                                    transition: 'border 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.border = '2px solid #078080'}
                                onBlur={(e) => e.target.style.border = '2px solid #e8e8e8'}
                            />
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '10px', 
                                    color: '#666', 
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    ⏱️ Thời gian (phút):
                                </label>
                                <input 
                                    type="number"
                                    value={newPomoDuration}
                                    onChange={(e) => setNewPomoDuration(parseInt(e.target.value) || 25)}
                                    min="1"
                                    max="120"
                                    style={{
                                        width: '100%', 
                                        padding: '14px 18px',
                                        border: '2px solid #e8e8e8', 
                                        borderRadius: '12px', 
                                        fontSize: '15px',
                                        outline: 'none', 
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            
                            <button
                                onClick={addPomodoro}
                                disabled={!newPomoName.trim()}
                                style={{
                                    width: '100%', 
                                    padding: '14px', 
                                    background: newPomoName.trim() 
                                        ? 'linear-gradient(135deg, #078080 0%, #05a5a5 100%)'
                                        : '#e8e8e8',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '12px',
                                    cursor: newPomoName.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: '16px', 
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    boxShadow: newPomoName.trim() 
                                        ? '0 4px 12px rgba(7, 128, 128, 0.3)'
                                        : 'none'
                                }}
                            >
                                Tạo Pomodoro
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SmartFeatures;