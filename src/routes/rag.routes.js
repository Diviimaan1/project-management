import { Router } from "express";
import {
    uploadDocument,
    uploadMultipleDocuments,
    chatWithDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
    ragHealthCheck
} from "../controllers/rag.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { uploadPdf, uploadMultiplePdfs } from "../utils/multer.config.js";

const router = Router();

// Health check (public)
router.route("/health").get(ragHealthCheck);

// All other routes require authentication
router.use(verifyJwt);

// Document listing (any authenticated user)
router.route("/documents").get(getDocuments);
router.route("/documents/:id").get(getDocumentById);

// Chat endpoint (any authenticated user)
router.route("/chat").post(chatWithDocument);

// Admin-only routes
// Single document upload
router.route("/upload").post(
    requireAdmin,
    uploadPdf.single("document"),
    uploadDocument
);

// Multiple document upload
router.route("/upload-multiple").post(
    requireAdmin,
    uploadMultiplePdfs,
    uploadMultipleDocuments
);

// Delete document (admin only)
router.route("/documents/:id").delete(requireAdmin, deleteDocument);

export default router;
