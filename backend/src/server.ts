import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Cortex Flow Backend is running' });
});

// Firebase Admin Test Route
app.get('/test-firebase', (req, res) => {
    try {
        const admin = require('./config/firebaseAdmin').default;
        if (admin.apps.length) {
            res.status(200).json({ status: 'ok', message: 'Firebase Admin initialized successfully' });
        } else {
            res.status(500).json({ status: 'error', message: 'Firebase Admin not initialized' });
        }
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
