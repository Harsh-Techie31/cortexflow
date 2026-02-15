const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const Integration = require('../models/integrationModel');
const { google } = require('googleapis');
const { fetchLastEmails, processEmail, chunkText } = require('../services/gmailService');
const { upsertEmailChunks } = require('../services/vectorService');

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5000/auth/google/callback';

/**
 * Trigger Gmail ingestion for the authenticated user.
 * POST /api/ingest/gmail
 */
router.post('/gmail', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.mongoId || req.user._id; // Middleware attaches the user
        // Note: Our authMiddleware currently attaches Firebase info. 
        // We need to ensure we have the MongoDB _id.
        // Let's lookup the user if mongoId isn't present.
        const User = require('../models/userModel');
        const userDoc = await User.findOne({ firebaseUid: req.user.uid });
        if (!userDoc) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        // 1. Get Google integration tokens
        const integration = await Integration.findOne({ userId: userDoc._id, platform: 'google' });
        if (!integration) {
            return res.status(400).json({ error: 'Gmail not connected' });
        }

        // 2. Setup OAuth2 client
        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oauth2Client.setCredentials({
            access_token: integration.accessToken,
            refresh_token: integration.refreshToken,
            expiry_date: integration.expiryDate
        });

        // Handle token refresh if needed (googleapis library handles this if refresh_token is present)
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                integration.refreshToken = tokens.refresh_token;
            }
            integration.accessToken = tokens.access_token;
            integration.expiryDate = tokens.expiry_date;
            await integration.save();
            console.log('Updated Google tokens in DB');
        });

        // 3. Fetch Emails
        console.log(`Starting ingestion for user: ${userDoc.email}`);
        const rawEmails = await fetchLastEmails(oauth2Client, 30);
        console.log(`Fetched ${rawEmails.length} emails`);

        const allChunks = [];
        for (const email of rawEmails) {
            const { body, metadata } = await processEmail(email, integration.profileEmail);
            const chunks = chunkText(body);

            chunks.forEach((content, index) => {
                allChunks.push({
                    content,
                    metadata: {
                        ...metadata,
                        chunkIndex: index
                    }
                });
            });
        }

        console.log(`Prepared ${allChunks.length} chunks for vectorization`);

        // 4. Store in ChromaDB
        if (allChunks.length > 0) {
            await upsertEmailChunks(userDoc._id, allChunks);
        }

        res.json({
            status: 'success',
            message: `Ingested ${rawEmails.length} emails into ${allChunks.length} searchable chunks.`,
            emailsCount: rawEmails.length,
            chunksCount: allChunks.length
        });

    } catch (error) {
        console.error('Email ingestion failed:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
