const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const contentRoutes = require('./routes/contentRoutes.js');

// Middleware to parse JSON bodies
app.use(express.json());

// Import and use routes
app.use('/api/v1/content', contentRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
