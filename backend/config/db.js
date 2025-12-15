const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  console.log(process.env.MONGO_DB_URI);
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB Connection Failed:', err.message);
    process.exit(1); // Dừng app nếu lỗi
  }
};

module.exports = connectDB;
