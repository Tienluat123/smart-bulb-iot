const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  is_online: { type: Boolean, default: false },

  // 1. Trạng thái hiện tại
  current_state: {
    power: { type: String, enum: ['ON', 'OFF'], default: 'OFF' },
    mode:  { type: String, enum: ['SLEEP', 'READ', 'FOCUS', 'MANUAL'], default: 'MANUAL' },
    brightness: { type: Number, default: 0 },
  },

  // 2. Cấu hình giờ tự động
  schedule_config: {
    morning_start: { type: String, default: "06:00" },
    night_start:   { type: String, default: "18:00" },
    sleep_max:     { type: Number, default: 30 },
    focus_min:     { type: Number, default: 60 }
  },

  // 3. Cấu hình Báo thức
  alarm_config: {
    time: { type: String, default: null }, 
    is_active: { type: Boolean, default: false }
  },

  // 4. Thống kê Pomodoro
  pomodoro_stats: {
    total_sessions: { type: Number, default: 0 }, 
    total_minutes:  { type: Number, default: 0 } 
  },

  // ==========================================
  // 5. [THÊM MỚI] Cờ Kiểm soát (Control Flags)
  //    Cờ này dùng để quản lý sự can thiệp thủ công (Manual Override)
  // ==========================================
  control_flags: {
    // Nếu FALSE: Chế độ tự động của Chip bị KHÓA. Server sẽ gửi lệnh '0' (Override) xuống Chip.
    auto_adjustment_enabled: {
        type: Boolean,
        default: true, // Mặc định là bật AI/tự động điều chỉnh
    },
    // Nếu TRUE: Chip được phép chạy logic điều chỉnh độ sáng nội bộ của nó.
  },

  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);
