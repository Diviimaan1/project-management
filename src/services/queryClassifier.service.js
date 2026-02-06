import { DocumentCategoryEnum } from "../utils/constants.js";

/**
 * Keywords for each document category
 * - Keep phrases first (checked via includes)
 * - Single words checked via token match
 */
const CATEGORY_KEYWORDS = {
  [DocumentCategoryEnum.APPROVAL]: [
    "approved",
    "approval",
    "indication",
    "indications",
    "dosage",
    "dose",
    "fda",
    "cdsco",
    "licensed",
    "registered",
    "therapeutic",
    "treatment",
    "prescribe",
    "prescribed",
  ],
  [DocumentCategoryEnum.SAFETY]: [
    "side effect",
    "side effects",
    "adverse",
    "contraindication",
    "contraindications",
    "warning",
    "warnings",
    "interaction",
    "interactions",
    "precaution",
    "precautions",
    "toxicity",
    "overdose",
    "pregnancy",
    "lactation",
    "pediatric",
    "geriatric",
  ],
  [DocumentCategoryEnum.REIMBURSEMENT]: [
    "cost",
    "price",
    "reimbursement",
    "insurance",
    "coverage",
    "ayushman",
    "bharat",
    "pmjay",
    "cashless",
    "claim",
    "generic",
    "brand",
    "affordable",
    "subsidy",
    "scheme",
  ],
};

/**
 * Normalize query into tokens
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);
}

/**
 * Classify a query to determine which document categories to search
 *
 * @param {string} query
 * @returns {{
 *   categories: string[],
 *   primaryCategory: string | null,
 *   confidence: "high" | "medium" | "low",
 *   retrievalMode: "strict" | "balanced" | "broad",
 *   reason: string
 * }}
 */
export function classifyQuery(query) {
  const lowerQuery = query.toLowerCase();
  const tokens = tokenize(query);

  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;

    for (const keyword of keywords) {
      // Phrase match (e.g. "side effects")
      if (keyword.includes(" ")) {
        if (lowerQuery.includes(keyword)) {
          scores[category] += 2; // phrases are stronger signals
        }
      }
      // Token match (e.g. "dosage")
      else if (tokens.includes(keyword)) {
        scores[category] += 1;
      }
    }
  }

  const matchedCategories = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // No strong signal → search everything
  if (matchedCategories.length === 0) {
    return {
      categories: Object.values(DocumentCategoryEnum),
      primaryCategory: null,
      confidence: "low",
      retrievalMode: "broad",
      reason: "No category-specific keywords detected",
    };
  }

  const confidence =
    matchedCategories.length === 1 ? "high" : "medium";

  return {
    categories: matchedCategories,
    primaryCategory: matchedCategories[0],
    confidence,
    retrievalMode:
      confidence === "high"
        ? "strict"
        : confidence === "medium"
        ? "balanced"
        : "broad",
    reason: `Matched keywords for: ${matchedCategories.join(", ")}`,
  };
}

/**
 * Human-readable description of each category
 */
export function getCategoryDescription(category) {
  const descriptions = {
    [DocumentCategoryEnum.APPROVAL]:
      "Drug approval status, indications, and dosage information",
    [DocumentCategoryEnum.SAFETY]:
      "Contraindications, side effects, and safety warnings",
    [DocumentCategoryEnum.REIMBURSEMENT]:
      "Insurance coverage, pricing, and reimbursement schemes",
  };

  return descriptions[category] || "General medical information";
}
