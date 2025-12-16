const { sendPushNotification } = require('../services/pushsafer.service');

// Gửi thông báo Pushsafer đến điện thoại
exports.sendPushNotificationToPhone = async (req, res) => {
	try {
		const { message, title, device } = req.body;
		if (!message || !title) {
			return res.status(400).json({ error: 'Thiếu message hoặc title!' });
		}
		const result = await sendPushNotification({ message, title, device });
		res.json({ success: true, result });
	} catch (err) {
		console.error('Lỗi gửi Pushsafer:', err);
		res.status(500).json({ error: 'Gửi thông báo thất bại: ' + err.message });
	}
};
