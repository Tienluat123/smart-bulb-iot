const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smart_bulb_db');
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB Connection Failed:', err.message);
    process.exit(1); // Dừng app nếu lỗi
  }
};

module.exports = connectDB;
