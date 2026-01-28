import { InferenceClient } from "@huggingface/inference";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

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
 * Format retrieved chunks for the prompt context
 * @param {Array} chunks - Array of document chunks
 * @returns {string} Formatted context string
 */
function formatChunks(chunks) {
    return chunks
        .map((chunk, i) => {
            return `
[Source ${i + 1}]
Page: ${chunk.metadata?.loc?.pageNumber ?? "unknown"}
Content:
${chunk.pageContent}
`;
        })
        .join("\n");
}

/**
 * Chat with documents using RAG
 * @param {string} query - User's question
 * @param {string} collectionName - Qdrant collection to search
 * @returns {Promise<{answer: string, sources: Array}>}
 */
export async function chat(query, collectionName) {
    const client = new InferenceClient(process.env.HF_TOKEN);
    const embeddings = getEmbeddings();
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: qdrantUrl,
            collectionName: collectionName,
        }
    );

    const vectorSearcher = vectorStore.asRetriever({
        k: 10,
    });

    const relevantChunks = await vectorSearcher.invoke(query);

    const CONTEXT = formatChunks(relevantChunks);

    const SYSTEM_PROMPT = `
You are a strict retrieval-based AI assistant.

RULES:
- You MUST answer ONLY using the sources provided below.
- If the answer is not present in the sources, say: "I don't know based on the provided document."
- Every factual statement MUST be cited using [Page: X].
- Do NOT use prior knowledge.

SOURCES:
${CONTEXT}
`;

    const response = await client.chatCompletion({
        model: "Qwen/Qwen3-4B-Instruct-2507:nscale",
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            {
                role: "user",
                content: query,
            },
        ],
    });

    const answer = response.choices[0].message.content;

    // Extract source information for response
    const sources = relevantChunks.map((chunk, i) => ({
        sourceNumber: i + 1,
        page: chunk.metadata?.loc?.pageNumber ?? "unknown",
        preview: chunk.pageContent.substring(0, 200) + "...",
    }));

    return {
        answer,
        sources,
    };
}
