const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const User = require('../models/userModel');

// Protected route to sync/get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;

    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
        // Optional: Update user details if changed
        // user.email = email;
        // user.displayName = name || user.displayName;
        // user.photoURL = picture || user.photoURL;
        // await user.save();
    } else {
        // Create new user
        user = await User.create({
            firebaseUid: uid,
            email,
            displayName: name || '',
            photoURL: picture || '',
        });
    }

    res.json({
      status: 'success',
      user, // Return MongoDB user object
      message: 'User synced successfully!',
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ status: 'error', message: 'Server error during sync' });
  }
});

module.exports = router;
