import { InferenceClient } from "@huggingface/inference";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { classifyQuery } from "./queryClassifier.service.js";
import { MedicalDocument } from "../models/medicalDocument.model.js";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const VECTOR_SCORE_THRESHOLD = 0.25;
const CROSS_ENCODER_THRESHOLD = 0.6;
const TOP_K = 20;
const FINAL_K = 6;

function collectionForCategory(category) {
  return `medical-${category.toLowerCase()}`;
}

function formatQuery(query) {
  return `Represent this question for retrieving relevant passages:\n${query}`;
}

function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
  return vec.map(x => x / norm);
}

function formatChunks(chunks) {
  return chunks
    .map((chunk, i) => `
[Source ${i + 1}]
Document: ${chunk.payload.documentName}
Source: ${chunk.payload.source}
Page: ${chunk.payload.page ?? "unknown"}
Content:
${chunk.payload.text}
`)
    .join("\n");
}

async function rerankWithCrossEncoder(client, query, chunks) {
  if (chunks.length === 0) return [];

  const inputs = chunks.map(chunk => ({
    query,
    text: chunk.payload.text,
  }));

  const res = await client.rerank({
    model: "BAAI/bge-reranker-base",
    inputs,
  });

  const scores = res.results.map(r => r.relevance_score);

  return chunks.map((chunk, idx) => ({
    ...chunk,
    crossScore: scores[idx],
  }));
}

const MEDICAL_SYSTEM_PROMPT = `You are a Digital Medical Representative AI assistant for Indian healthcare professionals.

STRICT RULES - YOU MUST FOLLOW THESE EXACTLY:

1. ONLY use information from the SOURCES provided below
2. If no relevant information is found in the sources, respond EXACTLY with:
   "Information not found in verified Indian sources. Please consult official CDSCO or healthcare provider resources."
3. EVERY factual statement MUST include a citation in format: [Source: Document Name, Page: X]
4. You provide FACTUAL INFORMATION ONLY - never provide medical advice or recommendations
5. Be concise and structured in your responses
6. If asked about something outside drug information/reimbursement, politely redirect

SOURCES:
`;

export async function chat(query, explicitCollection = null) {
  const client = new InferenceClient(process.env.HF_TOKEN);

  const classification = classifyQuery(query);
  const collections = explicitCollection
    ? [explicitCollection]
    : classification.categories.map(collectionForCategory);

  let retrieved = [];
  let searchedCollections = [];

  const embedding = await client.featureExtraction({
    model: "BAAI/bge-base-en-v1.5",
    inputs: formatQuery(query),
  });

  const queryVector = normalize(embedding);

  for (const collectionName of collections) {
    try {
      const res = await fetch(
        `${QDRANT_URL}/collections/${collectionName}/points/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vector: queryVector,
            limit: TOP_K,
            with_payload: true,
          }),
        }
      );

      if (!res.ok) continue;

      const data = await res.json();

      const filtered = data.result.filter(
        p => p.score >= VECTOR_SCORE_THRESHOLD
      );

      retrieved.push(
        ...filtered.map(p => ({
          score: p.score,
          payload: p.payload,
        }))
      );

      searchedCollections.push(collectionName);
    } catch (err) {
      console.error(`Search failed for ${collectionName}`, err.message);
    }
  }

  const reranked = await rerankWithCrossEncoder(
    client,
    query,
    retrieved
  );

  const confident = reranked
    .filter(c => c.crossScore >= CROSS_ENCODER_THRESHOLD)
    .sort((a, b) => b.crossScore - a.crossScore)
    .slice(0, FINAL_K);

  if (confident.length === 0) {
    return {
      answer:
        "Information not found in verified Indian sources. Please consult official CDSCO or healthcare provider resources.",
      sources: [],
      classification,
      searchedCollections,
      foundInSources: false,
    };
  }

  const CONTEXT = formatChunks(confident);

  const response = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
      { role: "system", content: MEDICAL_SYSTEM_PROMPT + CONTEXT },
      { role: "user", content: query },
    ],
  });

  return {
    answer: response.choices[0].message.content,
    sources: confident.map((c, i) => ({
      sourceNumber: i + 1,
      documentName: c.payload.documentName,
      source: c.payload.source,
      page: c.payload.page ?? "unknown",
      category: c.payload.category,
      preview: c.payload.text.slice(0, 150) + "...",
    })),
    classification,
    searchedCollections,
    foundInSources: true,
  };
}

export async function healthCheck() {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

  try {
    const response = await fetch(`${qdrantUrl}/collections`);
    const data = await response.json();

    return {
      qdrant: response.ok ? "connected" : "error",
      collections: data.result?.collections?.length || 0,
      hfToken: process.env.HF_TOKEN ? "configured" : "missing",
    };
  } catch (error) {
    return {
      qdrant: "disconnected",
      error: error.message,
    };
  }
}
