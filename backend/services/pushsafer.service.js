const Pushsafer = require('pushsafer-notifications');
const dotenv = require('dotenv');
dotenv.config();

const push = new Pushsafer({
    k: process.env.PUSHSAFER_PRIVATE_KEY,
    debug: true
});

const message = {
    m: 'Bảo Phạm xin chào! 📱',
    t: 'Pushsafer + ExpressJS',
    d: '99551' // <-- Device key của điện thoại
};

push.send(message, (err, result) => {
    if (err) {
        console.error(err);
    } else {
        console.log(result);
    }
});
