import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Upload, MessageSquare } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl text-white">MedRep AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to="/" className="text-slate-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-slate-800">
                                    <MessageSquare size={18} />
                                    <span>Chat</span>
                                </Link>

                                {/* Show Admin link only if systemRole is ADMIN */}
                                {user.systemRole === "ADMIN" && (
                                    <Link to="/admin/documents" className="text-slate-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-slate-800">
                                        <Upload size={18} />
                                        <span>Documents</span>
                                    </Link>
                                )}

                                <div className="flex items-center gap-4 pl-4 border-l border-slate-700">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-medium text-white">{user.fullname}</span>
                                        <span className="text-xs text-slate-400 capitalize">{user.systemRole.toLowerCase()}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-slate-300 hover:text-white font-medium">Login</Link>
                                <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
