const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

const roles = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
};

const permissions = {
    UPLOAD_VIDEO: ['instructor', 'admin'],
    VIEW_VIDEO: ['student', 'instructor', 'admin'],
    MANAGE_COURSE: ['instructor', 'admin'],
    MANAGE_USERS: ['admin'],
    TRANSCODE_VIDEO: ['admin'],
    DELETE_VIDEO: ['instructor', 'admin'],
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn('Permission denied', {
                userId: req.user.id,
                role: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path,
            });
            return next(new AppError('Permission denied', 403));
        }

        next();
    };
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (!permissions[permission].includes(req.user.role)) {
            return next(new AppError('Permission denied', 403));
        }

        next();
    };
};

module.exports = {
    roles,
    authorize,
    checkPermission,
    permissions,
};
