const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "bi_mat", { expiresIn: '30d' });
};

// 1. Đăng nhập bằng USERNAME
exports.loginUser = async (req, res) => {
    // Frontend sẽ gửi { username: "sv01", password: "123" }
    const { username, password } = req.body; 

    try {
        // Tìm user theo username
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username, // Trả về username
                fullname: user.fullname,
                email: user.email,       // Trả về email (để hiển thị trong profile)
                device_id: user.device_id,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Cập nhật Profile (Thoải mái đổi Email nhận tin)
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            // Người dùng được phép đổi Email (để nhận báo cáo)
            user.email = req.body.email || user.email;
            
            // Cập nhật các cái khác
            user.fullname = req.body.fullname || user.fullname;
            user.phone    = req.body.phone || user.phone;
            
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                fullname: updatedUser.fullname,
                email: updatedUser.email,    
                device_id: updatedUser.device_id,
                token: generateToken(updatedUser._id),
                message: "Cập nhật thành công! (Email nhận báo cáo đã thay đổi)"
            });
        } else {
            res.status(404).json({ message: "User không tồn tại" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
