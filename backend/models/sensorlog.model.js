const mongoose = require('mongoose');

const SensorLogSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  data: {
    temperature: Number,
    humidity: Number,
    ampere: Number,       // Cường độ dòng điện
    light_level: Number   // Độ sáng môi trường (Lux)
  },
  session_duration: { type: Number, default: 0 } // Thời gian bật đèn (phút)
}, {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'device_id',
    granularity: 'seconds'
  }
});

module.exports = mongoose.model('SensorLog', SensorLogSchema);
