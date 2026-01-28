import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import fs from "fs";
import { DocumentCategoryEnum } from "../utils/constants.js";

/**
 * Creates embeddings instance using HuggingFace
 * @returns {HuggingFaceInferenceEmbeddings}
 */
function getEmbeddings() {
    return new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HF_TOKEN,
        model: "BAAI/bge-base-en-v1.5",
    });
}

/**
 * Generate a collection name for medical documents
 * @param {string} category - Document category (APPROVAL/SAFETY/REIMBURSEMENT)
 * @returns {string}
 */
export function generateCollectionName(category) {
    return `medical-${category.toLowerCase()}-${Date.now()}`;
}

/**
 * Index a single PDF document into Qdrant vector store
 * @param {string} filepath - Path to the PDF file
 * @param {string} collectionName - Name for the Qdrant collection
 * @param {Object} metadata - Additional metadata (source, category)
 * @returns {Promise<{success: boolean, documentCount: number, collectionName: string}>}
 */
export async function indexDocument(filepath, collectionName, metadata = {}) {
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();

    // Enrich documents with additional metadata
    const enrichedDocs = docs.map(doc => ({
        ...doc,
        metadata: {
            ...doc.metadata,
            source: metadata.source || "Unknown",
            category: metadata.category || "GENERAL",
            documentName: metadata.name || "Unnamed Document"
        }
    }));

    const embeddings = getEmbeddings();
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    await QdrantVectorStore.fromDocuments(enrichedDocs, embeddings, {
        url: qdrantUrl,
        collectionName: collectionName,
    });

    // Clean up the uploaded file after indexing
    fs.unlinkSync(filepath);

    return {
        success: true,
        documentCount: docs.length,
        collectionName: collectionName,
    };
}

/**
 * Index multiple PDF documents into Qdrant vector store
 * @param {Array<{filepath: string, name: string, source: string}>} files - Array of file info
 * @param {string} category - Document category
 * @returns {Promise<{success: boolean, results: Array}>}
 */
export async function indexMultipleDocuments(files, category) {
    const results = [];

    for (const file of files) {
        const collectionName = generateCollectionName(category);
        try {
            const result = await indexDocument(file.filepath, collectionName, {
                source: file.source,
                category: category,
                name: file.name
            });
            results.push({
                ...result,
                name: file.name,
                category: category
            });
        } catch (error) {
            results.push({
                success: false,
                name: file.name,
                error: error.message
            });
            // Clean up file on error
            if (fs.existsSync(file.filepath)) {
                fs.unlinkSync(file.filepath);
            }
        }
    }

    return {
        success: results.every(r => r.success),
        results: results
    };
}

/**
 * Delete a collection from Qdrant
 * @param {string} collectionName - Name of the collection to delete
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteCollection(collectionName) {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    const response = await fetch(`${qdrantUrl}/collections/${collectionName}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
    }

    return { success: true };
}

/**
 * Get all collections for a specific category
 * @param {string} category - Document category
 * @returns {Promise<Array<string>>}
 */
export async function getCollectionsByCategory(category) {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    const response = await fetch(`${qdrantUrl}/collections`);
    if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    const prefix = `medical-${category.toLowerCase()}`;

    return data.result.collections
        .map(c => c.name)
        .filter(name => name.startsWith(prefix));
}
