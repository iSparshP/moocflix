const getMongoConfig = () => ({
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
});

module.exports = { getMongoConfig };
