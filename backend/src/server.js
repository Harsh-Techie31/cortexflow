const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

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
