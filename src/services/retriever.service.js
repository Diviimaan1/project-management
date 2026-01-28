import { InferenceClient } from "@huggingface/inference";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { classifyQuery } from "./queryClassifier.service.js";
import { MedicalDocument } from "../models/medicalDocument.model.js";

/**
 * Creates embeddings instance using HuggingFace
 * @returns {HuggingFaceInferenceEmbeddings}
 */
function getEmbeddings() {
    return new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HF_TOKEN,
        model: "BAAI/bge-base-en-v1.5",
    });
}

/**
 * Format retrieved chunks for the prompt context with rich citations
 * @param {Array} chunks - Array of document chunks
 * @returns {string} Formatted context string
 */
function formatChunks(chunks) {
    return chunks
        .map((chunk, i) => {
            const source = chunk.metadata?.source || "Unknown Source";
            const page = chunk.metadata?.loc?.pageNumber ?? "unknown";
            const docName = chunk.metadata?.documentName || "Document";
            return `
[Source ${i + 1}]
Document: ${docName}
Source: ${source}
Page: ${page}
Content:
${chunk.pageContent}
`;
        })
        .join("\n");
}

/**
 * Medical RAG system prompt with strict rules
 */
const MEDICAL_SYSTEM_PROMPT = `You are a Digital Medical Representative AI assistant for Indian healthcare professionals.

STRICT RULES - YOU MUST FOLLOW THESE EXACTLY:

1. ONLY use information from the SOURCES provided below
2. If no relevant information is found in the sources, respond EXACTLY with:
   "Information not found in verified Indian sources. Please consult official CDSCO or healthcare provider resources."
3. EVERY factual statement MUST include a citation in format: [Source: Document Name, Page: X]
4. You provide FACTUAL INFORMATION ONLY - never provide medical advice or recommendations
5. Be concise and structured in your responses
6. If asked about something outside drug information/reimbursement, politely redirect

WHAT YOU CAN HELP WITH:
- Drug approval status and indications (CDSCO)
- Dosage information
- Contraindications and safety warnings
- Side effects and drug interactions
- Ayushman Bharat/PMJAY reimbursement eligibility
- Generic availability

WHAT YOU CANNOT DO:
- Provide medical advice or diagnosis
- Recommend treatments
- Interpret lab results
- Answer questions not in your verified sources

SOURCES:
`;

/**
 * Chat with medical documents using agentic RAG
 * @param {string} query - User's question
 * @param {string|null} collectionName - Specific collection (optional, will auto-classify if null)
 * @returns {Promise<Object>} Response with answer, sources, and classification
 */
export async function chat(query, collectionName = null) {
    const client = new InferenceClient(process.env.HF_TOKEN);
    const embeddings = getEmbeddings();
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    // Classify query to determine which categories to search
    const classification = classifyQuery(query);

    let allChunks = [];
    let searchedCollections = [];

    if (collectionName) {
        // Search specific collection
        try {
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddings,
                { url: qdrantUrl, collectionName: collectionName }
            );
            const chunks = await vectorStore.asRetriever({ k: 5 }).invoke(query);
            allChunks = chunks;
            searchedCollections.push(collectionName);
        } catch (error) {
            console.error(`Error searching collection ${collectionName}:`, error.message);
        }
    } else {
        // Search collections based on classification
        const medicalDocs = await MedicalDocument.find({
            category: { $in: classification.categories }
        });

        for (const doc of medicalDocs) {
            try {
                const vectorStore = await QdrantVectorStore.fromExistingCollection(
                    embeddings,
                    { url: qdrantUrl, collectionName: doc.collectionName }
                );
                const chunks = await vectorStore.asRetriever({ k: 5 }).invoke(query);
                allChunks.push(...chunks);
                searchedCollections.push(doc.collectionName);
            } catch (error) {
                console.error(`Error searching collection ${doc.collectionName}:`, error.message);
            }
        }
    }

    // If no chunks found, return early with "not found" message
    if (allChunks.length === 0) {
        return {
            answer: "Information not found in verified Indian sources. Please consult official CDSCO or healthcare provider resources.",
            sources: [],
            classification: classification,
            searchedCollections: searchedCollections,
            foundInSources: false
        };
    }

    // Sort by relevance and take top chunks
    const topChunks = allChunks.slice(0, 10);
    const CONTEXT = formatChunks(topChunks);

    const response = await client.chatCompletion({
        model: "Qwen/Qwen3-4B-Instruct-2507:nscale",
        messages: [
            {
                role: "system",
                content: MEDICAL_SYSTEM_PROMPT + CONTEXT,
            },
            {
                role: "user",
                content: query,
            },
        ],
    });

    const answer = response.choices[0].message.content;

    // Extract source information for response
    const sources = topChunks.map((chunk, i) => ({
        sourceNumber: i + 1,
        documentName: chunk.metadata?.documentName || "Document",
        source: chunk.metadata?.source || "Unknown",
        page: chunk.metadata?.loc?.pageNumber ?? "unknown",
        category: chunk.metadata?.category || "GENERAL",
        preview: chunk.pageContent.substring(0, 150) + "...",
    }));

    return {
        answer,
        sources,
        classification: classification,
        searchedCollections: searchedCollections,
        foundInSources: true
    };
}

/**
 * Simple health check for the RAG system
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    try {
        const response = await fetch(`${qdrantUrl}/collections`);
        const data = await response.json();

        return {
            qdrant: response.ok ? "connected" : "error",
            collections: data.result?.collections?.length || 0,
            hfToken: process.env.HF_TOKEN ? "configured" : "missing"
        };
    } catch (error) {
        return {
            qdrant: "disconnected",
            error: error.message
        };
    }
}
