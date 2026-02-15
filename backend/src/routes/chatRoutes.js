const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authMiddleware } = require('../middleware/authMiddleware');
const { querySimilarChunks } = require('../services/vectorService');
const User = require('../models/userModel');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * @route   POST /api/chat/query
 * @desc    RAG Search - Retrieve context and generate answer with Gemini
 * @access  Private
 */
router.post('/query', authMiddleware, async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const userDoc = await User.findOne({ firebaseUid: req.user.uid });
        if (!userDoc) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`RAG Query from ${userDoc.email}: "${message}"`);

        // 1. Retrieve similar chunks from ChromaDB
        const { documents, metadatas } = await querySimilarChunks(userDoc._id, message, 6);

        if (!documents || documents.length === 0) {
            return res.json({
                answer: "I couldn't find any relevant information in your connected accounts to answer that question.",
                references: []
            });
        }

        // 2. Build Context
        const context = documents.map((doc, i) => `[Source ${i + 1}]:\n${doc}`).join('\n\n---\n\n');

        // 3. Prepare Gemini Prompt
        const prompt = `
You are Cortex, a highly intelligent and helpful AI assistant. 
Your goal is to answer the user's question accurately using ONLY the provided email context shards below.

RULES:
1. Use ONLY the provided context to answer. If the answer isn't in the context, say you don't find any relevant details in their emails.
2. Be concise but thorough.
3. If you find multiple relevant emails, synthesize the information correctly.
4. Do NOT mention "based on the documents" or "the provided context" in your final answer unless helpful — speak naturally.

CONTEXT FROM USER EMAILS:
${context}

USER QUESTION:
${message}

ANSWER (Be direct and helpful):
        `;

        // 4. Generate Answer
        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        // 5. Extract Unique References (Mail Links)
        const references = [...new Set(metadatas.map(m => m.mailLink))].filter(Boolean);

        res.json({
            answer,
            references
        });

    } catch (error) {
        console.error('RAG Query Error:', error);
        res.status(500).json({ error: 'Failed to process search query' });
    }
});

module.exports = router;
