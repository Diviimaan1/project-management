# 🏥 Digital Medical Representative AI

An intelligent agentic RAG system that provides healthcare professionals with instant, accurate drug and reimbursement information from verified Indian sources.

![MedRep AI Demo](client/public/vite.svg)

## ✨ Features

### 🧠 Agentic Core (Backend)
- **Smart Classification**: Automatically routes queries to Approval, Safety, or Reimbursement collections.
- **Strict Citations**: Every claim is cited with `[Source: Document Name, Page: X]`.
- **Anti-Hallucination**: responds with "Information not found in verified sources" if data is missing.
- **Multi-Collection Search**: Parallel search across multiple document types when needed.

### 💻 Modern Interface (Frontend)
- **Professional Chat UI**: Dark-themed, medical aesthetic with glassmorphism.
- **Expandable Citations**: Click to view full source text and metadata.
- **Admin Dashboard**: Drag-and-drop upload for multiple PDFs.
- **Role-Based Access**: Separate views for Doctors (Chat) and Admins (Upload).

## 📋 Document Categories

| Category | Content |
|----------|---------|
| `APPROVAL` | CDSCO drug labels, indications, dosage |
| `SAFETY` | Contraindications, side effects, warnings |
| `REIMBURSEMENT` | Ayushman Bharat coverage, PMJAY eligibility |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Docker (for Qdrant)
- MongoDB running locally
- HuggingFace API Token (for embeddings/LLM)

### 1. Backend Setup

```bash
# Clone and install
git clone <repo-url>
cd Udemy_project
npm install

# Setup Environment
cp .env.example .env
# Edit .env and add your HF_TOKEN
```

### 2. Frontend Setup

```bash
cd client
npm install
```

### 3. Start Infrastructure

```bash
# Start Qdrant Vector DB
cd docker
docker compose up -d
```

### 4. Run Application

**Terminal 1 (Backend):**
```bash
npm run dev
# Server runs on http://localhost:8000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 👤 Admin Setup

To upload documents, you need an Admin account.

1. **Register** a new user at `http://localhost:5173/register`
2. **Promote** the user to Admin via MongoDB shell:

```javascript
use medical-rep
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { systemRole: "ADMIN" } }
)
```
3. **Logout & Login** again to see the "Documents" tab.

---

## 📡 API Reference

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Get JWT token

### RAG Operations
- `POST /api/v1/rag/chat` - Chat with AI (User)
  - Body: `{ "query": "Is paracetamol approved?" }`
- `GET /api/v1/rag/documents` - List all docs (User)
- `POST /api/v1/rag/upload` - Upload PDF (Admin)
  - Form Data: `document` (file), `category` (enum), `source` (string)
- `POST /api/v1/rag/upload-multiple` - Batch upload (Admin)

---

## 🏗️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (Styling)
- Lucide React (Icons)
- React Router v6

**Backend**
- Node.js + Express
- LangChain.js (RAG orchestration)
- HuggingFace Inference (LLM + Embeddings)
- Multer (File handling)

**Database**
- MongoDB (User/Doc metadata)
- Qdrant (Vector storage)

---

## 🛡️ Trust & Safety

This system is designed for **high reliability**:
1. **No External Knowledge**: The LLM is instructed *only* to use provided context.
2. **Fact Checking**: Users can expand any citation to see the exact paragraph used.
3. **Scope Enforcement**: Queries outside medical scope are politely declined.

---

## 📄 License

ISC
