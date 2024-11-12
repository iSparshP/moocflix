const multer = require('multer');
const { ValidationError } = require('../utils/errors');
const config = require('../config/config');

const storage = multer.memoryStorage(); // Store in memory for direct S3 upload

const fileFilter = (req, file, cb) => {
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
        cb(
            new ValidationError(
                'Invalid file type. Only video files are allowed.'
            ),
            false
        );
        return;
    }

    if (file.size > config.upload.maxSize) {
        cb(new ValidationError('File size exceeds the limit.'), false);
        return;
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxSize,
    },
}).single('video');

module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            next(new ValidationError(err.message));
            return;
        }
        if (err) {
            next(err);
            return;
        }
        next();
    });
};
