const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    // 1. Kiểm tra trong Header có gửi kèm Token không?
    // Token thường có dạng: "Bearer eyJhbGciOiJIUzI1..."
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Lấy token ra (Tách bỏ chữ "Bearer " ở đầu, lấy chuỗi mã hóa phía sau)
            token = req.headers.authorization.split(' ')[1];

            // 3. Giải mã Token
            // Dùng đúng cái khóa bí mật lúc tạo token để mở khóa
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "bi_mat");

            // 4. Tìm User trong Database dựa vào ID trong token
            // .select('-password'): Lấy thông tin user nhưng KHÔNG LẤY mật khẩu (để bảo mật)
            req.user = await User.findById(decoded.id).select('-password');

            // Nếu tìm thấy user, cho phép đi tiếp sang bước tiếp theo (Controller)
            next(); 
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Token không hợp lệ, vui lòng đăng nhập lại!" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Không có quyền truy cập (Thiếu Token)" });
    }
};

module.exports = { protect };
