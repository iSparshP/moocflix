const axios = require('axios');
const config = require('../../config/config');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const userResponse = await axios.get(
            `${config.userManagementServiceURL}/validate`,
            {
                headers: { Authorization: token },
            }
        );

        if (!userResponse.data.valid) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = userResponse.data;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};
