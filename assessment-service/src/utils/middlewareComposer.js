const composeMiddleware = (middlewares) => {
    return middlewares.filter(Boolean);
};

module.exports = {
    composeMiddleware,
};
