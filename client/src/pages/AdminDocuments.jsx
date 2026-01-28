import { useState, useEffect } from "react";
import { Trash2, FileText } from "lucide-react";
import FileUpload from "../components/FileUpload";
import { apiClient } from "../api/client";

export default function AdminDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const categories = ["ALL", "APPROVAL", "SAFETY", "REIMBURSEMENT"];

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const endpoint = filter === "ALL" ? "/rag/documents" : `/rag/documents?category=${filter}`;
            const response = await apiClient(endpoint);
            setDocuments(response.data.documents);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [filter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await apiClient(`/rag/documents/${id}`, { method: "DELETE" });
            setDocuments(prev => prev.filter(doc => doc._id !== id));
        } catch (error) {
            alert("Failed to delete document");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-8">Document Management</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <FileUpload onUploadSuccess={fetchDocuments} />
                </div>

                {/* Document List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-white">Uploaded Documents</h2>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <span className="text-slate-400">Loading documents...</span>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 text-slate-500">
                                <FileText size={48} className="mb-4 opacity-50" />
                                <p>No documents found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50">
                                {documents.map((doc) => (
                                    <div key={doc._id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-700/50 p-2.5 rounded-lg mt-1">
                                                <FileText size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-200">{doc.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                        {doc.category}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {doc.pageCount} pages • {new Date(doc.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Source: {doc.source}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(doc._id)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Document"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
