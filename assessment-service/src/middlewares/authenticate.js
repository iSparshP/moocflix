// src/middlewares/authenticate.js
const axios = require('axios');
require('dotenv').config();

const authenticate = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res
            .status(401)
            .json({ message: 'Access denied. No token provided.' });
    }

    try {
        const response = await axios.get(
            'http://user-management-service/api/v1/auth/verify',
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            req.user = response.data.user;
            next();
        } else {
            res.status(401).json({ message: 'Invalid token.' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = authenticate;
