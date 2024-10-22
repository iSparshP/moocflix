require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const kafkaConsumer = require('./subscribers/kafkaConsumer');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api/v1/notifications', notificationRoutes);

app.listen(port, () => {
    console.log(`Notification service running on port ${port}`);
    kafkaConsumer.start();
});
