import fs from "fs";
import fetch from "node-fetch";

import { MedicalDocument } from "../models/medicalDocument.model.js";
import { indexDocument } from "./vectorStore.service.js";


export async function reindexDocument({
  documentId,
  filepath,
}) {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

  /* 1️⃣ Load Mongo document */
  const doc = await MedicalDocument.findById(documentId);
  if (!doc) {
    throw new Error("Document not found");
  }

  const {
    documentName,
    category,
    source,
    uploadedBy,
    description,
  } = doc;

  const collectionName = `medical-${category.toLowerCase()}`;

  /* 2️⃣ Mark Mongo as pending */
  doc.indexing.status = "pending";
  await doc.save();

  /* 3️⃣ Delete old vectors from Qdrant */
  const deleteResponse = await fetch(
    `${qdrantUrl}/collections/${collectionName}/points/delete`,
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
      }),
    }
  );

  if (!deleteResponse.ok) {
    doc.indexing.status = "failed";
    await doc.save();
    throw new Error(
      `Failed to delete existing vectors for "${documentName}"`
    );
  }

  /* 4️⃣ Re-run indexing */
  try {
    const result = await indexDocument({
      filepath,
      category,
      documentName,
      source,
      description,
      uploadedBy,
    });

    return {
      success: true,
      documentId,
      oldChunksDeleted: true,
      newChunksIndexed: result.chunksIndexed,
    };
  } catch (error) {
    doc.indexing.status = "failed";
    await doc.save();
    throw error;
  } finally {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
