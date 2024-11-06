const User = require('../models/User');
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

class UserService {
    async createUser(userData) {
        try {
            const user = await User.create(userData);
            logger.info('User created', { userId: user._id });
            return user;
        } catch (error) {
            logger.error('User creation failed', { error: error.message });
            throw new AppError('User creation failed', 500);
        }
    }

    // Add other user-related business logic
}

module.exports = new UserService();
