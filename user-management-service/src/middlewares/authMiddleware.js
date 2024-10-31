const User = require('../models/User.js');
const { verifyToken, extractTokenFromHeader } = require('../utils/tokenUtils');

exports.protect = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const decoded = verifyToken(token);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Not authorized' });
    }
};
