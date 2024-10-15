const User = require('../models/User.js');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ user: updatedUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deactivateAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.status(200).json({ message: 'Account deactivated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
