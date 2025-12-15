const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  is_online: { type: Boolean, default: false },

  // 1. Trạng thái hiện tại
  current_state: {
    power: { type: String, enum: ['ON', 'OFF'], default: 'OFF' },
    mode:  { type: String, enum: ['SLEEP', 'READ', 'FOCUS', 'MANUAL'], default: 'MANUAL' }
  },

  // 2. Cấu hình giờ tự động (Giữ nguyên)
  schedule_config: {
    morning_start: { type: String, default: "06:00" },
    night_start:   { type: String, default: "18:00" },
    sleep_max:     { type: Number, default: 30 },
    focus_min:     { type: Number, default: 60 }
  },

  // 3. Cấu hình Báo thức (Giữ nguyên)
  alarm_config: {
    time: { type: String, default: null }, 
    is_active: { type: Boolean, default: false }
  },

  // 4. Thống kê Pomodoro (Giữ nguyên)
  pomodoro_stats: {
    total_sessions: { type: Number, default: 0 }, 
    total_minutes:  { type: Number, default: 0 } 
  },

  // Đã XÓA control_flags

  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);
