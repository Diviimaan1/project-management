import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import fs from "fs";
import crypto from "crypto";
import { DocumentCategoryEnum } from "../utils/constants.js";
import { MedicalDocument } from "../models/medicalDocument.model.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const HF_TOKEN = process.env.HF_TOKEN;

const VECTOR_SIZE = 768;
const DISTANCE = "Cosine";
const BATCH_SIZE = 32;


function getEmbeddings() {
  return new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_TOKEN,
    model: "BAAI/bge-base-en-v1.5",
  });
}

export function collectionForCategory(category) {
  return `medical-${category.toLowerCase()}`;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function formatPassage(text) {
  return `Represent this passage for retrieval:\n${text}`;
}

function chunkArray(arr, size) {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

async function filterExistingByHash(collectionName, hashes) {
  if (hashes.length === 0) return new Set();

  const res = await fetch(
    `${QDRANT_URL}/collections/${collectionName}/points/scroll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          should: hashes.map(h => ({
            key: "hash",
            match: { value: h },
          })),
        },
        limit: hashes.length,
      }),
    }
  );

  if (!res.ok) return new Set();

  const data = await res.json();
  return new Set(data.result.points.map(p => p.payload.hash));
}


async function ensureCollection(collectionName) {
  const res = await fetch(`${QDRANT_URL}/collections/${collectionName}`);

  if (res.status === 404) {
    await fetch(`${QDRANT_URL}/collections/${collectionName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vectors: {
          size: VECTOR_SIZE,
          distance: DISTANCE,
        },
      }),
    });
  }
}


export async function indexDocument({
  filepath,
  category,
  documentName,
  source,
  uploadedBy,
  description,
}) {
  const collectionName = collectionForCategory(category);

  // 🔹 Ensure Mongo record exists (or create pending)
  let docRecord = await MedicalDocument.findOne({
    documentName,
    category,
    uploadedBy,
  });

  if (!docRecord) {
    docRecord = await MedicalDocument.create({
      documentName,
      category,
      collectionName,
      source,
      description,
      uploadedBy,
      indexing: { status: "pending" },
    });
  } else {
    docRecord.indexing.status = "pending";
    await docRecord.save();
  }

  try {
    /* 1️⃣ Ensure Qdrant collection */
    await ensureCollection(collectionName);

    /* 2️⃣ Load PDF */
    const loader = new PDFLoader(filepath);
    const rawDocs = await loader.load();

    /* 3️⃣ Chunk */
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 80,
    });

    const chunks = await splitter.splitDocuments(rawDocs);

    /* 4️⃣ Normalize + hash */
    const prepared = chunks.map((doc, idx) => {
      const cleanText = doc.pageContent.replace(/\s+/g, " ").trim();
      const hash = hashText(cleanText);

      return {
        id: hash,
        text: formatPassage(cleanText),
        hash,
        payload: {
          documentName,
          source,
          category,
          page: doc.metadata.loc?.pageNumber ?? null,
          chunkIndex: idx,
          hash,
        },
      };
    });

    /* 5️⃣ Deduplicate */
    const existingHashes = await filterExistingByHash(
      collectionName,
      prepared.map(p => p.hash)
    );

    const newChunks = prepared.filter(
      p => !existingHashes.has(p.hash)
    );

    /* 6️⃣ Manual batching + upsert */
    const embedder = getEmbeddings();
    const batches = chunkArray(newChunks, BATCH_SIZE);

    for (const batch of batches) {
      const vectors = await embedder.embedDocuments(
        batch.map(b => b.text)
      );
      console.log("Embedding batch size:", vectors.length);
      const points = batch.map((b, i) => ({
        id: b.id,
        vector: vectors[i],
        payload: {
            ...b.payload,
            text: b.text, 
        },
      }));

      await fetch(
        `${QDRANT_URL}/collections/${collectionName}/points`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points }),
        }
      );
    }

    console.log({
    prepared: prepared.length,
    existing: existingHashes.size,
    newChunks: newChunks.length,
    });


    /* 7️⃣ Update Mongo (SUCCESS) */
    docRecord.indexing = {
      status: "indexed",
      chunkCount: newChunks.length,
      skippedChunks: existingHashes.size,
      lastIndexedAt: new Date(),
    };
    await docRecord.save();

    return {
      success: true,
      documentId: docRecord._id,
      collectionName,
      chunksIndexed: newChunks.length,
      skipped: existingHashes.size,
    };
  } catch (error) {
    /* ❌ Update Mongo (FAILURE) */
    docRecord.indexing.status = "failed";
    await docRecord.save();

    throw error;
  } finally {
    /* 🧹 Cleanup */
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

export async function indexMultipleDocuments(
  files,
  category,
  uploadedBy
) {
  const indexed = [];
  const failed = [];

  let totalIndexedChunks = 0;
  let totalSkippedChunks = 0;

  for (const file of files) {
    try {
      const result = await indexDocument({
        filepath: file.filepath,
        category,
        documentName: file.name,
        source: file.source,
        description: file.description,
        uploadedBy,
      });

      indexed.push({
        documentId: result.documentId,
        name: file.name,
        chunksIndexed: result.chunksIndexed,
        skipped: result.skipped ?? 0,
      });

      totalIndexedChunks += result.chunksIndexed || 0;
      totalSkippedChunks += result.skipped || 0;

    } catch (error) {
      failed.push({
        name: file.name,
        error: error.message,
      });

      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
    }
  }

  return {
    success: failed.length === 0,
    collectionName: `medical-${category.toLowerCase()}`,
    summary: {
      filesProcessed: files.length,
      filesIndexed: indexed.length,
      filesFailed: failed.length,
      totalIndexedChunks,
      totalSkippedChunks,
    },
    indexed,
    failed,
  };
}

export async function deleteDocument({
  documentId,
}) {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

  const doc = await MedicalDocument.findById(documentId);
  if (!doc) {
    throw new Error("Document not found");
  }

  const { documentName, category } = doc;
  const collectionName = `medical-${category.toLowerCase()}`;

  /* 1️⃣ Delete from Qdrant */
  const response = await fetch(
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

  if (!response.ok) {
    throw new Error(
      `Failed to delete Qdrant vectors for "${documentName}"`
    );
  }

  /* 2️⃣ Delete Mongo record */
  await MedicalDocument.deleteOne({ _id: documentId });

  return {
    success: true,
    documentId,
    documentName,
    collectionName,
  };
}

/**
 * Get all collections for a specific category
 * @param {string} category - Document category
 * @returns {Promise<Array<string>>}
 */
export async function getDocumentsByCategory(category) {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
  const collectionName = `medical-${category.toLowerCase()}`;

  const response = await fetch(
    `${qdrantUrl}/collections/${collectionName}/points/scroll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        limit: 1000,
        with_payload: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const data = await response.json();

  // Extract unique documents
  const documents = new Map();

  for (const point of data.result.points) {
    const { documentName, source } = point.payload;
    if (!documents.has(documentName)) {
      documents.set(documentName, {
        documentName,
        source,
        category,
      });
    }
  }

  return Array.from(documents.values());
}

export async function deleteCollection() { }