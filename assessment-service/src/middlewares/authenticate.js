// src/middlewares/authenticate.js
const axios = require('axios');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res
            .status(401)
            .json({ message: 'No authorization token provided' });
    }

    try {
        const response = await axios.get('http://auth-service/api/v1/verify', {
            headers: { Authorization: token },
        });
        req.user = response.data;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authenticate;
