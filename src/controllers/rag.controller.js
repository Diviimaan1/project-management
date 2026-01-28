import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { indexDocument, deleteCollection, generateCollectionName } from "../services/vectorStore.service.js";
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

    const collectionName = generateCollectionName(category);

    const result = await indexDocument(req.file.path, collectionName, {
        source: source || "Unknown",
        category: category,
        name: req.file.originalname
    });

    // Save document metadata to MongoDB
    const medicalDoc = await MedicalDocument.create({
        name: req.file.originalname,
        category: category,
        collectionName: collectionName,
        source: source || "Unknown",
        description: description || "",
        pageCount: result.documentCount,
        uploadedBy: req.user._id
    });

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
            const collectionName = generateCollectionName(category);

            const indexResult = await indexDocument(file.path, collectionName, {
                source: source || "Unknown",
                category: category,
                name: file.originalname
            });

            const medicalDoc = await MedicalDocument.create({
                name: file.originalname,
                category: category,
                collectionName: collectionName,
                source: source || "Unknown",
                pageCount: indexResult.documentCount,
                uploadedBy: req.user._id
            });

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
