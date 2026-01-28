import { Router } from "express";
import { uploadDocument, chatWithDocument, deleteDocument } from "../controllers/rag.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { uploadPdf } from "../utils/multer.config.js";

const router = Router();

// All routes require authentication
router.use(verifyJwt);

// POST /api/v1/rag/upload - Upload and index a PDF document
router.route("/upload").post(uploadPdf.single("document"), uploadDocument);

// POST /api/v1/rag/chat - Chat with documents
router.route("/chat").post(chatWithDocument);

// DELETE /api/v1/rag/:collectionName - Delete a document collection
router.route("/:collectionName").delete(deleteDocument);

export default router;
