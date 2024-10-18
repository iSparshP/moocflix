const express = require('express');
const connectDB = require('../config/config.js');
const userRoutes = require('./routes/userRoutes.js');
const profileRoutes = require('./routes/profileRoutes.js');

const app = express();
connectDB();

app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', profileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
