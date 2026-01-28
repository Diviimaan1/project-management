import mongoose, { Schema } from "mongoose";
import { DocumentCategoryEnum, AvailableDocumentCategories } from "../utils/constants.js";

const medicalDocumentSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: AvailableDocumentCategories,
        required: true
    },
    collectionName: {
        type: String,
        required: true,
        unique: true
    },
    source: {
        type: String,
        trim: true,
        default: "Unknown"
    },
    description: {
        type: String,
        trim: true
    },
    pageCount: {
        type: Number,
        default: 0
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient queries by category
medicalDocumentSchema.index({ category: 1 });
medicalDocumentSchema.index({ uploadedBy: 1 });

export const MedicalDocument = mongoose.model("MedicalDocument", medicalDocumentSchema);
