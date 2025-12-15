const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <--- Cần cái này

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

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log("Yêu cầu cập nhật từ user:", req.user.id, req.body);

        if (user) {
            // 1. Cập nhật thông tin cơ bản
            user.email = req.body.email || user.email;
            user.fullname = req.body.fullname || user.fullname;
            user.phone = req.body.phone || user.phone;

            // 2. Xử lý Đổi mật khẩu (Logic chặt chẽ hơn)
            if (req.body.newPassword && req.body.newPassword.trim() !== "") {
                
                // A. Bắt buộc phải có mật khẩu hiện tại
                if (!req.body.currentPassword) {
                    return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu." });
                }

                // B. So sánh mật khẩu cũ bằng bcrypt (thay vì ===)
                const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" }); // Báo lỗi ngay
                }
               
               // Giả sử Model bạn đã làm hook pre-save như bài trước:
               user.password = req.body.newPassword; 
            }

            // 3. Lưu vào DB
            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                fullname: updatedUser.fullname,
                email: updatedUser.email,    
                device_id: updatedUser.device_id,
                token: generateToken(updatedUser._id),
                message: "Cập nhật thành công!"
            });
        } else {
            res.status(404).json({ message: "User không tồn tại" });
        }
    } catch (error) {
        // Xử lý lỗi trùng email (nếu email là unique)
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email này đã được sử dụng." });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        // req.user.id có được nhờ middleware verifyToken đã giải mã token
        const userId = req.user.id;

        // Tìm user theo ID, trừ trường password ra
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Trả về object user (chứa username, fullname, email, phone...)
        res.json(user);

    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        res.status(500).json({ message: 'Lỗi Server.' });
    }
};
