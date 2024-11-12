const videoRoutes = require('./videoRoutes');
const healthRoutes = require('./healthRoutes');

module.exports = (app) => {
    app.use('/health', healthRoutes);
    app.use('/api/v1/videos', videoRoutes);
};
