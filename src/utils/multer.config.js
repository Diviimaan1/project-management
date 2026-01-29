import multer from "multer";
import path from "path";
import { ApiError } from "./api-error.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Only PDF files are allowed"), false);
    }
};

export const uploadPdf = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 30 * 1024 * 1024, // 10MB limit per file
    },
});

// Multi-file upload (up to 5 documents)
export const uploadMultiplePdfs = uploadPdf.array("documents", 5);
