import { DocumentCategoryEnum } from "../utils/constants.js";

/**
 * Keywords for each document category
 */
const CATEGORY_KEYWORDS = {
    [DocumentCategoryEnum.APPROVAL]: [
        "approved", "approval", "indication", "indications",
        "dosage", "dose", "fda", "cdsco", "licensed", "registered",
        "therapeutic", "treatment", "prescribe", "prescribed"
    ],
    [DocumentCategoryEnum.SAFETY]: [
        "side effect", "side effects", "adverse", "contraindication",
        "contraindications", "warning", "warnings", "interaction",
        "interactions", "precaution", "precautions", "toxicity",
        "overdose", "pregnancy", "lactation", "pediatric", "geriatric"
    ],
    [DocumentCategoryEnum.REIMBURSEMENT]: [
        "cost", "price", "reimbursement", "insurance", "coverage",
        "ayushman", "bharat", "pmjay", "cashless", "claim",
        "generic", "brand", "affordable", "subsidy", "scheme"
    ]
};

/**
 * Classify a query to determine which document categories to search
 * @param {string} query - User's question
 * @returns {Object} Classification result with categories and confidence
 */
export function classifyQuery(query) {
    const lowerQuery = query.toLowerCase();
    const scores = {};

    // Calculate score for each category based on keyword matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        scores[category] = 0;
        for (const keyword of keywords) {
            if (lowerQuery.includes(keyword)) {
                scores[category]++;
            }
        }
    }

    // Find categories with matches
    const matchedCategories = Object.entries(scores)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category);

    // If no specific match, search all categories
    if (matchedCategories.length === 0) {
        return {
            categories: Object.values(DocumentCategoryEnum),
            primaryCategory: null,
            confidence: "low",
            reason: "No specific keywords detected, searching all categories"
        };
    }

    return {
        categories: matchedCategories,
        primaryCategory: matchedCategories[0],
        confidence: matchedCategories.length === 1 ? "high" : "medium",
        reason: `Matched keywords for: ${matchedCategories.join(", ")}`
    };
}

/**
 * Get a description of what each category covers
 * @param {string} category 
 * @returns {string}
 */
export function getCategoryDescription(category) {
    const descriptions = {
        [DocumentCategoryEnum.APPROVAL]: "Drug approval status, indications, and dosage information",
        [DocumentCategoryEnum.SAFETY]: "Contraindications, side effects, and safety warnings",
        [DocumentCategoryEnum.REIMBURSEMENT]: "Insurance coverage, pricing, and Ayushman Bharat eligibility"
    };
    return descriptions[category] || "General medical information";
}
