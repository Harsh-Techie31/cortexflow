
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const googleRoutes = require('./routes/googleRoutes');
const connectDB = require('./config/db');

connectDB();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth/google', googleRoutes);

// Health Check
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Cortex Flow Backend is running' });
});

// Firebase Admin Test Route
app.get('/test-firebase', (req, res) => {
    try {
        const admin = require('./config/firebaseAdmin');
        if (admin.apps.length) {
            res.status(200).json({ status: 'ok', message: 'Firebase Admin initialized successfully' });
        } else {
            res.status(500).json({ status: 'error', message: 'Firebase Admin not initialized' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
