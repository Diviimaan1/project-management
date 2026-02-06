import fetch from "node-fetch";
import { MedicalDocument } from "../models/medicalDocument.model.js";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

/**
 * Check if a document has any chunks in Qdrant
 */
export async function verifyDocumentInQdrant({
  category,
  documentName,
}) {
  const collectionName = `medical-${category.toLowerCase()}`;

  const response = await fetch(
    `${QDRANT_URL}/collections/${collectionName}/points/scroll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "documentName",
              match: { value: documentName },
            },
          ],
        },
        limit: 1,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to query Qdrant");
  }

  const data = await response.json();

  return {
    exists: data.result.points.length > 0,
    count: data.result.points.length,
  };
}

/**
 * Verify MongoDB ↔ Qdrant consistency for a document
 */
export async function verifyDocumentConsistency(documentId) {
  const doc = await MedicalDocument.findById(documentId);
  if (!doc) {
    throw new Error("Document not found in MongoDB");
  }

  const qdrantCheck = await verifyDocumentInQdrant({
    category: doc.category,
    documentName: doc.documentName,
  });

  return {
    documentId,
    mongoStatus: doc.indexing.status,
    mongoChunkCount: doc.indexing.chunkCount,
    qdrantHasChunks: qdrantCheck.exists,
    consistent:
      doc.indexing.status === "indexed" && qdrantCheck.exists,
  };
}
