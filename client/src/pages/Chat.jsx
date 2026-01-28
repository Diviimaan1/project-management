import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import ChatMessage from "../components/ChatMessage";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm your Digital Medical Representative. I can help you with drug approvals, safety information, and reimbursement queries based on verified Indian sources.\n\nHow can I assist you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await apiClient("/rag/chat", {
                method: "POST",
                body: JSON.stringify({ query: userMessage.content })
            });

            const aiMessage = {
                role: "assistant",
                content: response.data.answer,
                sources: response.data.sources,
                classification: response.data.classification
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I apologize, but I encountered an error processing your request. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto px-4 w-full">
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} />
                ))}
                {loading && (
                    <div className="flex gap-4 p-6 bg-slate-800/30 rounded-lg animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Loader2 size={18} className="text-primary animate-spin" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="py-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about drug approvals, safety, or reimbursement..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-500 shadow-lg backdrop-blur-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 p-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:bg-slate-700 rounded-lg text-white transition-all"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-xs text-slate-500">
                        For professional use only. Answers must be verified against official documents.
                    </p>
                </div>
            </div>
        </div>
    );
}
