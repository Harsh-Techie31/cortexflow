import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

// Import service account key
// In production, this path should be handled more securely or via env vars
// For now, we assume the file is in the same directory or loaded via require
const serviceAccount = require('./serviceAccountKey.json') as ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
