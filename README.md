# 🏥 Digital Medical Representative AI

An intelligent agentic RAG system that provides healthcare professionals with instant, accurate drug and reimbursement information from verified Indian sources.

## ✨ Features

- **Agentic RAG** - Auto-classifies queries and routes to appropriate document collections
- **Cited Answers** - Every response includes `[Source: Document Name, Page: X]`
- **Trust-First Design** - Returns "Not found in verified sources" when unsure
- **Multi-Upload** - Batch upload up to 5 medical documents at once
- **Role-Based Access** - Admin-only document management

## 📋 Document Categories

| Category | Content |
|----------|---------|
| `APPROVAL` | CDSCO drug labels, indications, dosage |
| `SAFETY` | Contraindications, side effects, warnings |
| `REIMBURSEMENT` | Ayushman Bharat coverage, PMJAY eligibility |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18-20
- Docker (for Qdrant)
- MongoDB
- HuggingFace API Token

### 1. Clone & Install

```bash
git clone <repo-url>
cd Udemy_project
git checkout feature/rag
npm install
```

### 2. Environment Setup

Create a `.env` file (see `.env.example`):

```env
# Database
MONGO_URI=mongodb://localhost:27017/medical-rep

# Server
PORT=8000
CORS_ORIGIN=*

# JWT Auth
ACCESS_TOKEN_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRY=10m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=1d

# RAG Configuration
HF_TOKEN=your-huggingface-token
QDRANT_URL=http://localhost:6333
```

### 3. Start Qdrant Vector Database

```bash
cd docker
docker compose up -d
```

### 4. Run the Server

```bash
npm run dev
```

---

## 👤 Setting Up Admin User

After registering a user, promote them to admin:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { systemRole: "ADMIN" } }
)
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |

### RAG System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/rag/health` | Public | System health check |
| GET | `/api/v1/rag/documents` | User | List all documents |
| GET | `/api/v1/rag/documents/:id` | User | Get document details |
| POST | `/api/v1/rag/chat` | User | **Chat with AI** |
| POST | `/api/v1/rag/upload` | Admin | Upload single PDF |
| POST | `/api/v1/rag/upload-multiple` | Admin | Upload multiple PDFs |
| DELETE | `/api/v1/rag/documents/:id` | Admin | Delete document |

---

## 📖 Usage Examples

### Upload a Document (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@drug_label.pdf" \
  -F "category=APPROVAL" \
  -F "source=CDSCO"
```

### Upload Multiple Documents (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/rag/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "documents=@drug1.pdf" \
  -F "documents=@drug2.pdf" \
  -F "category=SAFETY" \
  -F "source=CDSCO"
```

### Chat with AI

```bash
curl -X POST http://localhost:8000/api/v1/rag/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Is paracetamol approved for fever in India?"}'
```

**Example Response:**
```json
{
  "statusCode": 200,
  "data": {
    "answer": "Yes, paracetamol is approved for fever treatment in India. [Source: Paracetamol Label, Page: 1]",
    "sources": [...],
    "classification": {
      "categories": ["APPROVAL"],
      "primaryCategory": "APPROVAL",
      "confidence": "high"
    },
    "foundInSources": true
  }
}
```

### Query Without Match

```json
{
  "answer": "Information not found in verified Indian sources. Please consult official CDSCO or healthcare provider resources.",
  "foundInSources": false
}
```

---

## 🏗️ Project Structure

```
src/
├── controllers/
│   └── rag.controller.js       # Upload, chat, document management
├── middlewares/
│   ├── auth.middleware.js      # JWT verification
│   └── admin.middleware.js     # Admin role check
├── models/
│   ├── user.model.js           # User with systemRole
│   └── medicalDocument.model.js # Document metadata
├── routes/
│   └── rag.routes.js           # RAG API routes
├── services/
│   ├── vectorStore.service.js  # PDF indexing to Qdrant
│   ├── retriever.service.js    # Agentic RAG chat
│   └── queryClassifier.service.js # Query routing
└── utils/
    ├── constants.js            # Document categories, roles
    └── multer.config.js        # PDF upload config
```

---

## � What This System Does / Doesn't Do

### ✅ Does
- Provide factual drug information from verified documents
- Show approval status, contraindications, dosage
- Check Ayushman Bharat reimbursement eligibility
- Cite all sources with page numbers

### ❌ Doesn't
- Provide medical advice or diagnosis
- Recommend treatments
- Make claims without source documents
- Answer questions not in uploaded documents

---

## 📝 Recommended Documents for Demo

1. **CDSCO Drug Label** - Any approved drug's official label (PDF)
2. **Clinical Guideline** - Indian medical association guidelines
3. **Ayushman Bharat Document** - PMJAY coverage/pricing info

---

## 🛠️ Tech Stack

- **Backend**: Express.js (ES Modules)
- **Database**: MongoDB + Mongoose
- **Vector Store**: Qdrant
- **Embeddings**: HuggingFace `BAAI/bge-base-en-v1.5`
- **LLM**: Qwen via HuggingFace Inference
- **File Upload**: Multer
- **Auth**: JWT

---

## 📄 License

ISC

---

## 👨‍💻 Author

Digvijay
