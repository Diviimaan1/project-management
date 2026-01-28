import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import fs from "fs";

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
 * Index a PDF document into Qdrant vector store
 * @param {string} filepath - Path to the PDF file
 * @param {string} collectionName - Name for the Qdrant collection
 * @returns {Promise<{success: boolean, documentCount: number}>}
 */
export async function indexDocument(filepath, collectionName) {
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();

    const embeddings = getEmbeddings();

    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    await QdrantVectorStore.fromDocuments(docs, embeddings, {
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
