const express = require('express');
const app = express();
const port = process.env.HEALTH_CHECK_PORT || 3001;

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Health check service running on port ${port}`);
});
