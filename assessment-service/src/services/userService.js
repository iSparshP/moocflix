const axios = require('axios');

exports.validateUser = async (userId) => {
    try {
        const response = await axios.get(
            `http://user-management-service/api/v1/users/${userId}`
        );
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
