const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { syncUser } = require('../utils/userSync');

const router = express.Router();

// Protected route to sync/get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await syncUser(req.user);

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
