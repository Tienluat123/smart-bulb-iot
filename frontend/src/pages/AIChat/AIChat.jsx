import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './AIChat.css'; 
import ReactMarkdown from 'react-markdown';
import { sendAIChat, sendWeeklyReport } from '../../services/assistant.service'; 

// Danh sách các từ/kí tự cấm (Ví dụ đơn giản)
const FORBIDDEN_WORDS = ['chính trị', 'xâm phạm', 'bạo lực', 'nguy hiểm', 'hack', '<', '>'];
const FORBIDDEN_REGEX = new RegExp(FORBIDDEN_WORDS.join('|'), 'i');

const AIChat = () => {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Xin chào! Tôi là Trợ lý AI. Bạn muốn hỏi về thiết bị hay cần tôi gửi báo cáo?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportStatus, setReportStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'
    const messagesEndRef = useRef(null);

    // Cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Hàm kiểm tra nội dung cấm
    const isInputForbidden = (text) => {
        if (FORBIDDEN_REGEX.test(text)) {
            return true;
        }
        if (text.includes('<') || text.includes('>')) {
            return true;
        }
        return false;
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        if (isInputForbidden(input)) {
            setMessages(prev => [
                ...prev,
                { sender: 'user', text: input },
                { sender: 'ai', text: 'Xin lỗi, câu hỏi của bạn chứa nội dung không được phép.' }
            ]);
            setInput('');
            return;
        }

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendAIChat(input);
            const aiResponse = { sender: 'ai', text: response.data.reply };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: 'Lỗi kết nối với Trợ lý AI. Vui lòng kiểm tra Server Backend.' };
            setMessages(prev => [...prev, errorMessage]);
            console.error('Lỗi gọi API AI:', error); // Giữ lại error log quan trọng
        } finally {
            setLoading(false);
        }
    };

    const handleSendReport = async () => {
        setReportStatus('sending');
        try {
            const response = await sendWeeklyReport();
            setReportStatus('success');
            setTimeout(() => setReportStatus('idle'), 5000);
            alert(response.data.message);
        } catch (error) {
            setReportStatus('error');
            setTimeout(() => setReportStatus('idle'), 5000);
            alert('Lỗi gửi báo cáo. Vui lòng kiểm tra log Server.');
            console.error('Lỗi gửi báo cáo email:', error); // Giữ lại error log quan trọng
        }
    };

    const getReportButtonText = () => {
        switch (reportStatus) {
            case 'sending': return 'Đang gửi...';
            case 'success': return 'Đã gửi Email!';
            case 'error': return 'Lỗi gửi!';
            default: return 'Gửi Báo cáo 7 ngày';
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="chat-container">
                    <div className="chat-header">
                        <h2>Trợ lý AI</h2>
                        <button 
                            className="report-button"
                            onClick={handleSendReport}
                            disabled={reportStatus === 'sending'}
                            style={{ 
                                backgroundColor: reportStatus === 'success' ? '#4CAF50' : (reportStatus === 'error' ? '#f44336' : '#078080'),
                                transition: 'background-color 0.3s'
                            }}
                        >
                            {getReportButtonText()}
                        </button>
                    </div>

                    <div className="chat-box">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-content">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message ai">
                                <div className="message-content loading">...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Hỏi về thiết bị, trạng thái, hoặc lịch sử..."
                            disabled={loading}
                        />
                        <button onClick={handleSend} disabled={loading}>
                            Gửi
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIChat;
