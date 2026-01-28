import { Bot, User as UserIcon } from "lucide-react";
import SourceCard from "./SourceCard";

export default function ChatMessage({ message }) {
    const isAI = message.role === "assistant";

    return (
        <div className={`flex gap-4 p-6 ${isAI ? "bg-slate-800/30" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                {isAI ? <Bot size={18} /> : <UserIcon size={18} />}
            </div>

            <div className="flex-1 max-w-4xl">
                <div className="font-medium text-sm text-slate-400 mb-1">
                    {isAI ? "MedRep Agent" : "You"}
                </div>
                <div className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </div>

                {/* Display sources if available */}
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {message.sources.map((source, idx) => (
                            <SourceCard key={idx} source={source} />
                        ))}
                    </div>
                )}

                {/* Display classification info if available for debugging/transparency */}
                {message.classification && (
                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                        <span>Searched:</span>
                        {message.classification.categories.map(cat => (
                            <span key={cat} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {cat}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
