const axios = require('axios');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const response = await axios.get(
            `${process.env.USER_MANAGEMENT_SERVICE_URL}/validate`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (response.data.valid) {
            req.user = response.data.user;
            next();
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
