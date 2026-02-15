const { CohereClient } = require('cohere-ai');
const { CloudClient } = require('chromadb');

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

const chromaClient = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE
});

/**
 * Generates embeddings for an array of text strings using Cohere with batching.
 * @param {string[]} texts 
 * @returns {Promise<number[][]>}
 */
const generateEmbeddings = async (texts) => {
    const BATCH_SIZE = 90; // Cohere limit is 96
    const allEmbeddings = [];

    try {
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE);
            console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`);

            const response = await cohere.embed({
                texts: batch,
                model: 'embed-english-v3.0',
                inputType: 'search_document',
            });

            allEmbeddings.push(...response.embeddings);
        }
        return allEmbeddings;
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
    }
};

/**
 * Stores email chunks in ChromaDB.
 * @param {string} userId - To filter or create specific collection
 * @param {Array} chunks - Array of { content, metadata }
 */
const upsertEmailChunks = async (userId, chunks) => {
    try {
        // We'll use a single collection but filter by userId in metadata for multi-tenancy
        const collectionName = "user_knowledge_base";

        // Use embeddingFunction: null since we manualy provide embeddings
        const collection = await chromaClient.getOrCreateCollection({
            name: collectionName,
            embeddingFunction: {
                generate: async (texts) => { return []; } // Dummy function to avoid default embed error
            },
            metadata: { "description": "Unified knowledge base for all users" }
        });

        const texts = chunks.map(c => c.content);
        const embeddings = await generateEmbeddings(texts);

        const ids = chunks.map((_, i) => `${userId}_gmail_${Date.now()}_${i}`);
        const metadatas = chunks.map(c => ({
            ...c.metadata,
            userId: userId.toString(),
            source: 'gmail'
        }));

        await collection.upsert({
            ids,
            embeddings,
            metadatas,
            documents: texts,
        });

        console.log(`Successfully stored ${chunks.length} chunks in ChromaDB for user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error upserting to ChromaDB:', error);
        throw error;
    }
};

module.exports = { upsertEmailChunks };
