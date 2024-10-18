const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendMessage } = require('../../config/kafka');

exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const newUser = await User.create({ name, email, password, role });
        await sendMessage('User-Creation', {
            userId: newUser._id,
            email: newUser.email,
        });
        res.status(201).json({ message: 'User created', user: newUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'Logged in', token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ message: 'Logged out' });
};
