const axios = require('axios');
const BaseService = require('./baseService');
const { ServiceError, NotFoundError } = require('../utils/errors');

class UserService extends BaseService {
    static async validateUser(userId) {
        return await this.handleServiceCall(async () => {
            try {
                const response = await axios.get(
                    `${process.env.USER_SERVICE_URL}/api/v1/users/${userId}`,
                    { timeout: 5000 }
                );
                return response.status === 200;
            } catch (error) {
                if (error.response?.status === 404) {
                    throw new NotFoundError('User not found');
                }
                throw new ServiceError(
                    'User',
                    error.response?.data?.message || 'Failed to validate user'
                );
            }
        }, 'Failed to validate user');
    }
}

module.exports = UserService;
