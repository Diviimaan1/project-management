import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";

export default function SourceCard({ source }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-slate-700 rounded-lg bg-slate-900/50 overflow-hidden mt-2">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        Source {source.sourceNumber}
                    </span>
                    <span className="text-sm font-medium text-slate-200 truncate">
                        {source.documentName}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                        • Page {source.page}
                    </span>
                </div>
                {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {expanded && (
                <div className="p-3 pt-0 border-t border-slate-700/50 bg-slate-800/20">
                    <div className="flex items-center gap-2 mb-2 mt-2">
                        <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                            {source.source}
                        </span>
                        {source.category && (
                            <span className="text-xs text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                                {source.category}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-300 italic font-serif leading-relaxed pl-3 border-l-2 border-primary/50">
                        "{source.preview}"
                    </p>
                </div>
            )}
        </div>
    );
}
