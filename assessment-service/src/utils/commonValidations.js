const { body, param } = require('express-validator');

const createRequiredStringValidator = (field, message) => {
    return body(field).notEmpty().trim().isString().withMessage(message);
};

const createMongoIdValidator = (field, message) => {
    return param(field).isMongoId().withMessage(message);
};

const createNumberRangeValidator = (field, min, max, message) => {
    return body(field).isFloat({ min, max }).withMessage(message);
};

module.exports = {
    createRequiredStringValidator,
    createMongoIdValidator,
    createNumberRangeValidator,
};
