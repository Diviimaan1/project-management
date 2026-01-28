import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function Register() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        fullname: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await register(
            formData.username,
            formData.email,
            formData.fullname,
            formData.password
        );

        if (result.success) {
            navigate("/login");
        } else {
            setError(result.error || "Registration failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                name="fullname"
                                required
                                value={formData.fullname}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="Dr. John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="johndoe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="doctor@hospital.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
