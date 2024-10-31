const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AppError } = require('../utils/errorUtils');

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} email - Email notifications enabled
 * @property {boolean} push - Push notifications enabled
 */

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (email) =>
                    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
                message: 'Please provide a valid email',
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: {
                values: ['student', 'instructor', 'admin'],
                message: '{VALUE} is not a valid role',
            },
            default: 'student',
        },
        notificationPreferences: {
            type: Map,
            of: Boolean,
            default: {
                email: true,
                push: true,
            },
            validate: {
                validator: (prefs) => {
                    return prefs.has('email') && prefs.has('push');
                },
                message: 'Invalid notification preferences',
            },
        },
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
        lastLogin: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(new AppError('Error hashing password', 500));
    }
});

// Helper Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateNotificationPreferences = function (preferences) {
    this.notificationPreferences = new Map({
        ...Object.fromEntries(this.notificationPreferences),
        ...preferences,
    });
    return this.save();
};

// Query Middleware
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
