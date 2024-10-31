const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const { sendMessage } = require('../../config/kafka');
const { generateToken } = require('../utils/tokenUtils');

exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Create user using the User model
        const newUser = await User.create({ name, email, password, role });

        // Produce Kafka event for user creation
        await sendMessage('User-Creation', {
            userId: newUser._id,
            email: newUser.email,
            role: newUser.role,
            timestamp: new Date().toISOString(),
        });
        res.status(201).json({ message: 'User created', user: newUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const user = await User.findOne({ email });
    // Validate password using bcrypt
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token using tokenUtils
    const token = generateToken(user._id, user.role);
};

exports.logout = (req, res) => {
    res.status(200).json({ message: 'Logged out' });
};
