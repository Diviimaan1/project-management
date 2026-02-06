import mongoose, { Schema } from "mongoose";
import { AvailableDocumentCategories } from "../utils/constants.js";

const medicalDocumentSchema = new Schema(
  {
    /** Human-readable document name (used in Qdrant payload) */
    documentName: {
      type: String,
      required: true,
      trim: true,
    },

    /** Document category (maps to Qdrant collection) */
    category: {
      type: String,
      enum: AvailableDocumentCategories,
      required: true,
    },

    /** Derived, NOT unique anymore */
    collectionName: {
      type: String,
      required: true,
      index: true,
    },

    /** Source authority (FDA, CDSCO, EMA, etc.) */
    source: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    /** Optional human description */
    description: {
      type: String,
      trim: true,
    },

    /** Indexing lifecycle */
    indexing: {
      status: {
        type: String,
        enum: ["pending", "indexed", "failed"],
        default: "pending",
      },
      chunkCount: {
        type: Number,
        default: 0,
      },
      skippedChunks: {
        type: Number,
        default: 0,
      },
      lastIndexedAt: {
        type: Date,
      },
    },

    /** Upload ownership */
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* Useful indexes */
medicalDocumentSchema.index({ category: 1 });
medicalDocumentSchema.index({ "indexing.status": 1 });

export const MedicalDocument = mongoose.model(
  "MedicalDocument",
  medicalDocumentSchema
);
