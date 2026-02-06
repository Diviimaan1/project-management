import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { indexDocument, deleteCollection, collectionForCategory } from "../services/vectorStore.service.js";
import { chat, healthCheck } from "../services/retriever.service.js";
import { MedicalDocument } from "../models/medicalDocument.model.js";
import { AvailableDocumentCategories } from "../utils/constants.js";

/**
 * Upload and index a single medical document (Admin only)
 * POST /api/v1/rag/upload
 */
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No PDF file uploaded");
    }

    const { category, source, description } = req.body;

    if (!category || !AvailableDocumentCategories.includes(category)) {
        throw new ApiError(400, `Category is required. Valid values: ${AvailableDocumentCategories.join(", ")}`);
    }

    const collectionName = collectionForCategory(category);

    const result = await indexDocument({
        filepath: req.file.path,
        category,
        documentName: req.file.originalname,
        source: source || "Unknown",
        description,
        uploadedBy: req.user._id
    });

    // Save document metadata to MongoDB
    // Note: indexDocument already creates the record if it doesn't exist, but here we might be duplicating logic 
    // or the controller wants to ensure the response has the doc. 
    // However, indexDocument returns `{ success, documentId, ... }`
    // Let's rely on indexDocument's return or fetch the created doc.
    // But the original code created a MedicalDocument explicitly AFTER indexing.
    // The service `indexDocument` ALSO creates/finds a MedicalDocument (lines 97-112 of service).
    // The service implementation handles DB creation.
    // So we should just use the result from indexDocument to fetch/return the doc.

    // Wait, let's look at the original controller logic. It creates a document AFTER indexing. 
    // But the service creates it BEFORE/DURING indexing. 
    // Using the service effectively means we don't need to create it here again, or we might reference the one created.
    // The Service returns `documentId`.

    const medicalDoc = await MedicalDocument.findById(result.documentId);

    return res.status(201).json(
        new ApiResponse(201, {
            document: medicalDoc,
            indexingResult: result
        }, "Medical document uploaded and indexed successfully")
    );
});

/**
 * Upload multiple medical documents (Admin only)
 * POST /api/v1/rag/upload-multiple
 */
const uploadMultipleDocuments = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "No PDF files uploaded");
    }

    const { category, source } = req.body;

    if (!category || !AvailableDocumentCategories.includes(category)) {
        throw new ApiError(400, `Category is required. Valid values: ${AvailableDocumentCategories.join(", ")}`);
    }

    const results = [];

    for (const file of req.files) {
        try {
            const indexResult = await indexDocument({
                filepath: file.path,
                category,
                documentName: file.originalname,
                source: source || "Unknown",
                uploadedBy: req.user._id
            });

            const medicalDoc = await MedicalDocument.findById(indexResult.documentId);

            results.push({
                success: true,
                document: medicalDoc
            });
        } catch (error) {
            results.push({
                success: false,
                filename: file.originalname,
                error: error.message
            });
        }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(201).json(
        new ApiResponse(201, {
            uploaded: successCount,
            total: req.files.length,
            results: results
        }, `${successCount}/${req.files.length} documents uploaded successfully`)
    );
});

/**
 * Chat with medical documents using agentic RAG
 * POST /api/v1/rag/chat
 */
const chatWithDocument = asyncHandler(async (req, res) => {
    const { query, collectionName } = req.body;

    if (!query) {
        throw new ApiError(400, "Query is required");
    }

    const result = await chat(query, collectionName || null);

    return res.status(200).json(
        new ApiResponse(200, result, "Query processed successfully")
    );
});

/**
 * Get all uploaded medical documents
 * GET /api/v1/rag/documents
 */
const getDocuments = asyncHandler(async (req, res) => {
    const { category } = req.query;

    const filter = {};
    if (category && AvailableDocumentCategories.includes(category)) {
        filter.category = category;
    }

    const documents = await MedicalDocument.find(filter)
        .populate("uploadedBy", "username fullname")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, {
            count: documents.length,
            documents: documents
        }, "Documents retrieved successfully")
    );
});

/**
 * Get a single document by ID
 * GET /api/v1/rag/documents/:id
 */
const getDocumentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const document = await MedicalDocument.findById(id)
        .populate("uploadedBy", "username fullname");

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    return res.status(200).json(
        new ApiResponse(200, document, "Document retrieved successfully")
    );
});

/**
 * Delete a medical document and its collection (Admin only)
 * DELETE /api/v1/rag/documents/:id
 */
const deleteDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const document = await MedicalDocument.findById(id);

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    // Delete from Qdrant
    try {
        await deleteCollection(document.collectionName);
    } catch (error) {
        console.error(`Failed to delete Qdrant collection: ${error.message}`);
    }

    // Delete from MongoDB
    await MedicalDocument.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, { deletedDocument: document }, "Document deleted successfully")
    );
});

/**
 * Health check for RAG system
 * GET /api/v1/rag/health
 */
const ragHealthCheck = asyncHandler(async (req, res) => {
    const health = await healthCheck();
    const docCount = await MedicalDocument.countDocuments();

    return res.status(200).json(
        new ApiResponse(200, {
            ...health,
            documentsInDB: docCount
        }, "RAG system health check")
    );
});

export {
    uploadDocument,
    uploadMultipleDocuments,
    chatWithDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
    ragHealthCheck
};
