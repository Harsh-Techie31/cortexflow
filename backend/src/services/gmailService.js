const { google } = require('googleapis');
const { convert } = require('html-to-text');

/**
 * Fetches the last 30 emails for the authenticated user.
 */
const fetchLastEmails = async (oauth2Client, count = 30) => {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 1. List messages
    const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: count,
        q: 'category:primary' // Focus on primary inbox to avoid spam/promotions
    });

    if (!listRes.data.messages) return { emails: [], maxHistoryId: null };

    const emails = [];
    let maxHistoryId = 0;

    for (const msg of listRes.data.messages) {
        const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id
        });
        const email = msgRes.data;
        emails.push(email);

        // Keep track of largest historyId
        const hId = parseInt(email.historyId);
        if (hId > maxHistoryId) maxHistoryId = hId;
    }

    return { emails, maxHistoryId: maxHistoryId.toString() };
};

/**
 * Extracts clean text body and metadata from a Gmail message.
 */
const processEmail = async (message, userEmail) => {
    const headers = message.payload.headers;
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    const metadata = {
        emailId: message.id,
        threadId: message.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        timestamp: getHeader('Date'),
        mailLink: `https://mail.google.com/mail/u/${userEmail}/#inbox/${message.id}`
    };

    // Extract body text
    let body = "";
    if (message.payload.parts) {
        // Multi-part message
        const part = message.payload.parts.find(p => p.mimeType === 'text/plain') ||
            message.payload.parts.find(p => p.mimeType === 'text/html');
        if (part && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            if (part.mimeType === 'text/html') {
                body = convert(body, { wordwrap: 130 });
            }
        }
    } else if (message.payload.body.data) {
        // Single-part message
        body = Buffer.from(message.payload.body.data, 'base64').toString();
        if (message.payload.mimeType === 'text/html') {
            body = convert(body, { wordwrap: 130 });
        }
    }

    // fallback to snippet if body is still empty
    if (!body.trim()) {
        body = message.snippet || "";
    }

    return { body, metadata };
};

/**
 * Split text into overlapping chunks.
 */
const chunkText = (text, size = 1000, overlap = 150) => {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = start + size;
        const chunk = text.substring(start, end);
        chunks.push(chunk);

        if (end >= text.length) break;
        start += (size - overlap);
    }

    return chunks;
};

module.exports = {
    fetchLastEmails,
    processEmail,
    chunkText
};
