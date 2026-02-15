const express = require('express');
const { google } = require('googleapis');
const admin = require('../config/firebaseAdmin');
const User = require('../models/userModel');
const Integration = require('../models/integrationModel');
const { syncUser } = require('../utils/userSync');

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5000/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Scopes for Gmail and basic user profile
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];


// frontend calls this to get the URL to redirect the user to Google
// Expected: GET /auth/google/auth?token=<firebase_id_token>
router.get('/auth', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Firebase token required' });
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Ensure user is synced with MongoDB
        const user = await syncUser(decodedToken);

        // Create auth URL with UID in state
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            state: user.firebaseUid, // Use synced UID
            prompt: 'consent'
        });

        res.json({ url: authUrl });
    } catch (error) {
        console.error('Error generating Google Auth URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Callback handler
// Google redirects here after user consents
// Expected: GET /auth/google/callback?code=...&state=...
router.get('/callback', async (req, res) => {
    const { code, state } = req.query; // state is our Firebase UID

    if (!code || !state) {
        return res.status(400).send('Missing code or state');
    }

    try {
        const uid = state;

        // Find user in MongoDB
        const user = await User.findOne({ firebaseUid: uid });
        if (!user) {
            return res.status(404).send('User not found in database');
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile info from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Save or update integration in MongoDB
        await Integration.findOneAndUpdate(
            { userId: user._id, platform: 'google' },
            {
                userId: user._id,
                platform: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined,
                expiryDate: tokens.expiry_date,
                scope: tokens.scope,
                profileEmail: userInfo.data.email,
                profileName: userInfo.data.name,
                profilePicture: userInfo.data.picture
            },
            { upsert: true, new: true }
        );

        // Redirect user back to frontend dashboard
        res.redirect('http://localhost:3000/dashboard?integration=google&status=success');
    } catch (error) {
        console.error('Error in Google OAuth callback:', error);
        res.redirect('http://localhost:3000/dashboard?integration=google&status=error');
    }
});

// 3. Get integration status
// Expected: GET /auth/google/status?token=<firebase_id_token>
router.get('/status', async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Firebase token required' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        // Auto-sync user
        const user = await syncUser(decodedToken);

        const integration = await Integration.findOne({ userId: user._id, platform: 'google' });

        res.json({
            connected: !!integration,
            profile: integration ? {
                name: integration.profileName,
                picture: integration.profilePicture,
                email: integration.profileEmail
            } : null
        });
    } catch (error) {
        console.error('Error fetching Google status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
