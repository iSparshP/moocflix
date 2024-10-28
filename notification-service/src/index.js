require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const kafkaConsumer = require('./subscribers/kafkaConsumer');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use(bodyParser.json());
app.use('/api/v1/notifications', notificationRoutes);

app.listen(port, () => {
    console.log(`Notification service running on port ${port}`);
    kafkaConsumer.start();
});
