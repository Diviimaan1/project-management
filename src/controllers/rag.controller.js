import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { indexDocument, deleteCollection } from "../services/vectorStore.service.js";
import { chat } from "../services/retriever.service.js";

/**
 * Upload and index a PDF document
 * POST /api/v1/rag/upload
 */
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No PDF file uploaded");
    }

    // Generate a unique collection name based on user ID and timestamp
    const collectionName = `doc-${req.user._id}-${Date.now()}`;

    const result = await indexDocument(req.file.path, collectionName);

    return res.status(201).json(
        new ApiResponse(201, result, "Document uploaded and indexed successfully")
    );
});

/**
 * Chat with documents using RAG
 * POST /api/v1/rag/chat
 */
const chatWithDocument = asyncHandler(async (req, res) => {
    const { query, collectionName } = req.body;

    if (!query) {
        throw new ApiError(400, "Query is required");
    }

    if (!collectionName) {
        throw new ApiError(400, "Collection name is required");
    }

    const result = await chat(query, collectionName);

    return res.status(200).json(
        new ApiResponse(200, result, "Query processed successfully")
    );
});

/**
 * Delete a document collection
 * DELETE /api/v1/rag/:collectionName
 */
const deleteDocument = asyncHandler(async (req, res) => {
    const { collectionName } = req.params;

    if (!collectionName) {
        throw new ApiError(400, "Collection name is required");
    }

    const result = await deleteCollection(collectionName);

    return res.status(200).json(
        new ApiResponse(200, result, "Collection deleted successfully")
    );
});

export { uploadDocument, chatWithDocument, deleteDocument };
