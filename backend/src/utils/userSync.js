const User = require('../models/userModel');

/**
 * Syncs a Firebase user with the MongoDB database.
 * If the user doesn't exist, it creates one.
 * If the user exists, it (optionally) updates their profile info.
 * @param {Object} firebaseUser - Decoded Firebase user object from admin.auth().verifyIdToken()
 * @returns {Promise<Object>} The MongoDB user document
 */
const syncUser = async (firebaseUser) => {
    const { uid, email, name, picture } = firebaseUser;

    // Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
        console.log('Creating new user in MongoDB:', uid, email);
        user = await User.create({
            firebaseUid: uid,
            email,
            displayName: name || '',
            photoURL: picture || '',
        });
    } else {
        // Optional: Update name/picture if they have changed in Firebase
        let hasChanges = false;
        if (name && user.displayName !== name) {
            user.displayName = name;
            hasChanges = true;
        }
        if (picture && user.photoURL !== picture) {
            user.photoURL = picture;
            hasChanges = true;
        }
        if (hasChanges) {
            await user.save();
        }
    }

    return user;
};

module.exports = { syncUser };
