import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

export default function FileUpload({ onUploadSuccess }) {
    const [files, setFiles] = useState([]);
    const [category, setCategory] = useState("");
    const [source, setSource] = useState("");
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const fileInputRef = useRef(null);

    const categories = ["APPROVAL", "SAFETY", "REIMBURSEMENT"];

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            // Convert FileList to Array and take up to 5
            const newFiles = Array.from(e.target.files).slice(0, 5);
            setFiles(newFiles);
            setStatus(null);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (files.length === 0 || !category) {
            setStatus({ type: 'error', message: 'Please select files and a category' });
            return;
        }

        setUploading(true);
        setStatus(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('documents', file);
            });
            formData.append('category', category);
            if (source) formData.append('source', source);

            const endpoint = files.length > 1 ? '/rag/upload-multiple' : '/rag/upload';

            // If single file, the key is 'document' not 'documents' for the single endpoint
            // But let's check our backend implementation
            // Backend single: uploadPdf.single("document")
            // Backend multi: uploadMultiplePdfs (upload.array("documents", 5))

            if (files.length === 1) {
                // Create new FormData for single upload to match backend expectation
                const singleFormData = new FormData();
                singleFormData.append('document', files[0]);
                singleFormData.append('category', category);
                if (source) singleFormData.append('source', source);

                await apiClient('/rag/upload', {
                    method: 'POST',
                    body: singleFormData,
                });
            } else {
                await apiClient('/rag/upload-multiple', {
                    method: 'POST',
                    body: formData,
                });
            }

            setStatus({ type: 'success', message: 'Documents uploaded successfully!' });
            setFiles([]);
            setSource("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (onUploadSuccess) onUploadSuccess();

        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Upload size={20} className="text-primary" />
                Upload Documents
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Category *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Source Name</label>
                        <input
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="e.g. CDSCO, Ayushman Bharat"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-primary/50 hover:bg-slate-800/50 rounded-xl p-8 text-center cursor-pointer transition-all"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf"
                        multiple
                    />
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-slate-800 p-3 rounded-full">
                            <Upload size={24} className="text-slate-400" />
                        </div>
                        <p className="text-slate-300 font-medium">Click to upload PDFs</p>
                        <p className="text-xs text-slate-500">Up to 5 files, 10MB each</p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={16} className="text-primary flex-shrink-0" />
                                    <span className="text-sm text-slate-300 truncate">{file.name}</span>
                                    <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-slate-500"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {status && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading || files.length === 0 || !category}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                </button>
            </form>
        </div>
    );
}
