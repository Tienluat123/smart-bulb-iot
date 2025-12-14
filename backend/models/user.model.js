const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // [MỚI] Tên đăng nhập (Bắt buộc & Duy nhất)
  username: { type: String, required: true, unique: true },
  
  // Email dùng để nhận báo cáo (Có thể thay đổi)
  email:    { type: String, required: true }, 
  
  password: { type: String, required: true },
  fullname: { type: String, required: true },
  phone:    { type: String },
  device_id: { type: String, required: true } 
}, { timestamps: true });

// ... (Các phần mã hóa password giữ nguyên như cũ) ...
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
