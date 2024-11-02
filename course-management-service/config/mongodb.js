const mongoose = require('mongoose');

const connectToMongoDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            retryReads: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        };

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

module.exports = connectToMongoDB;
