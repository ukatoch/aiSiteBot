import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, Globe, Loader2, AlertCircle, CheckCircle, Copy, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hostname, setHostname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ bot_id: string; hostname: string } | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/v1/auth/register', {
                email,
                username,
                password,
                hostname
            });
            setSuccessData(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyBotId = () => {
        if (successData) {
            navigator.clipboard.writeText(successData.bot_id);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-8 text-center"
                >
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h1>
                    <p className="text-slate-500 text-sm mb-8">Your account has been created and your bot is ready for {successData.hostname}.</p>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Unique Bot ID</p>
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                            <code className="text-primary font-mono font-bold text-lg">{successData.bot_id}</code>
                            <button
                                onClick={copyBotId}
                                className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500"
                                title="Copy ID"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-3 italic">
                            Share this ID with your developers to embed the bot in your website.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                        >
                            Go to Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[450px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="p-8 pb-6 relative">
                    <Link to="/login" className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5 inline mr-1" />
                        <span className="text-xs font-semibold">Back to Login</span>
                    </Link>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <UserPlus className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
                    <p className="text-slate-500 text-sm">Sign up to get started with AISiteGPT.</p>
                </div>

                <form onSubmit={handleRegister} className="p-8 pt-0 space-y-5">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="johndoe"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-[15px]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
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

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Your Website Domain</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={hostname}
                                onChange={(e) => setHostname(e.target.value)}
                                placeholder="example.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-[15px]"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 ml-1">Domain where the bot will be installed.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </button>
                </form>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
