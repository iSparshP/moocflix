const express = require('express');
const {
    getProfile,
    updateProfile,
    deactivateAccount,
} = require('../controllers/profileController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile/update', protect, updateProfile);
router.delete('/deactivate', protect, deactivateAccount);

module.exports = router;
