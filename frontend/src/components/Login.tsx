import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('username', email); // OAuth2PasswordRequestForm expects 'username'
        formData.append('password', password);

        try {
            const response = await axios.post('/api/v1/auth/login', formData);
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('is_superuser', String(response.data.is_superuser));
            navigate('/admin');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="p-8 pb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <LogIn className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500 text-sm">Log in to manage your AISiteGPT bots.</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 pt-0 space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-[15px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-[15px]"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center space-y-3">
                    <p className="text-sm text-slate-600">
                        Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
                    </p>
                    <p className="text-[10px] text-slate-400">
                        Protected by AISiteGPT Security Systems
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
