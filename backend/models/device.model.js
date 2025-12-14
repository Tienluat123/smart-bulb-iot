const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  is_online: { type: Boolean, default: false },

  // 1. Trạng thái hiện tại (Giữ nguyên)
  current_state: {
    power: { type: String, enum: ['ON', 'OFF'], default: 'OFF' },
    mode:  { type: String, enum: ['SLEEP', 'READ', 'FOCUS', 'MANUAL'], default: 'MANUAL' },
    brightness: { type: Number, default: 0 },
  },

  // 2. Cấu hình giờ tự động (Giữ nguyên code cũ của bạn)
  schedule_config: {
    morning_start: { type: String, default: "06:00" },
    night_start:   { type: String, default: "18:00" },
    sleep_max:     { type: Number, default: 30 },
    focus_min:     { type: Number, default: 60 }
  },

  // 3. [MỚI THÊM VÀO] Cấu hình Báo thức (Để lưu DB)
  alarm_config: {
    time: { type: String, default: null }, // Ví dụ: "06:30"
    is_active: { type: Boolean, default: false } // Đang bật hay tắt
  },

  // 4. [MỚI THÊM VÀO] Thống kê Pomodoro (KPI chăm chỉ)
  pomodoro_stats: {
    total_sessions: { type: Number, default: 0 }, // Tổng số lần hoàn thành
    total_minutes:  { type: Number, default: 0 }  // Tổng số phút tập trung
  },

  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);
