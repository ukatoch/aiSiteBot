import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, RotateCcw, MessageSquare, Loader2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface ChatInterfaceProps { }

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
    const [query, setQuery] = useState('');
    const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('chat_user_email'));
    const [showEmailPrompt, setShowEmailPrompt] = useState(!localStorage.getItem('chat_user_email'));
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: localStorage.getItem('chat_user_email')
                ? '👋 Hi, I’m the AISiteGPT Assistant. How can I help you today?'
                : '👋 Hi, I’m the AISiteGPT Assistant. Please enter your email to start chatting.'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get bot configuration from URL if available (for embedded mode)
    const searchParams = new URLSearchParams(window.location.search);
    const botId = searchParams.get('botId') || 'bot-default';
    const parentHostname = searchParams.get('hostname') || window.location.hostname;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading, showEmailPrompt]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage = { role: 'user' as const, content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/v1/chat', {
                question: userMessage.content,
                botId: botId,
                hostname: parentHostname,
                sessionId: sessionId,
                userEmail: userEmail
            });

            if (response.data.sessionId) {
                setSessionId(response.data.sessionId);
            }

            const botMessage = {
                role: 'assistant' as const,
                content: response.data.answer,
                sources: response.data.sources
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = {
                role: 'assistant' as const,
                content: 'Sorry, I ran into an issue. Please try again.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.trim() || !emailRegex.test(emailInput)) {
            setEmailError('Please enter a valid email address.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'try again with valid email'
            }]);
            return;
        }

        setEmailError(null);
        setUserEmail(emailInput);
        localStorage.setItem('chat_user_email', emailInput);
        setShowEmailPrompt(false);

        // Add success message from bot
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'thanks for your information'
        }]);

        // Initialize session on identification if query exists or just to link
        // This keeps the flow clean.
    };

    const handleRestart = () => {
        // Keep initial welcome message
        setMessages([messages[0]]);
        setSessionId(null);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">

            {/* .chat-header */}
            <div className="flex items-center gap-3 p-[14px_16px] border-b border-[#e5e7eb] flex-shrink-0 relative z-10">
                <div className="w-[36px] h-[36px] bg-primary rounded-full flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div className="font-semibold text-slate-800 flex-1">
                    AISiteGPT Assistant
                </div>
                <button
                    onClick={handleRestart}
                    title="Restart Chat"
                    className="text-[#64748b] hover:bg-slate-100 p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* .messages */}
            <div className="flex-1 overflow-y-auto w-full p-4 flex flex-col gap-[14px]" ref={scrollRef}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-end gap-2 ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                        >
                            {/* Bot Avatar - Only for bot messages */}
                            {msg.role === 'assistant' && (
                                <div className="w-[36px] h-[36px] rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-teal-700 shadow-sm">
                                    <Bot className="w-5 h-5" />
                                    {/* <img src="../assets/bot.png" alt="bot" />*/}
                                </div>
                            )}

                            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {/* Bubble */}
                                <div
                                    className={`p-[12px_14px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'assistant'
                                        ? 'bg-[#f1f5f9] text-[#0f172a] rounded-[14px] rounded-tl-none'
                                        : 'bg-[#006d77] rounded-[14px] rounded-tr-none'
                                        }`}
                                    style={{ color: msg.role === 'user' ? '#ffffff' : 'inherit' }}
                                >
                                    {msg.content}

                                    {/* Sources */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className={`mt-2 pt-2 border-t ${msg.role === 'assistant' ? 'border-slate-200' : 'border-white/20'}`}>
                                            <p className={`text-[10px] font-bold mb-1 opacity-70`}>SOURCES</p>
                                            <div className="flex flex-wrap gap-1">
                                                {msg.sources.map((src, i) => (
                                                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded opacity-80 truncate max-w-[150px] ${msg.role === 'assistant' ? 'bg-white border border-slate-200' : 'bg-white/20'
                                                        }`}>
                                                        {src}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <div className="mt-1.5 text-[11px] text-slate-400 font-medium">
                                    {msg.role === 'user' ? 'Just now' : idx === 0 ? '' : 'Just now'}
                                </div>
                            </div>

                            {/* User Avatar - Only for user messages */}
                            {msg.role === 'user' && (
                                <div className="w-[36px] h-[36px] rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-500">
                                    <User className="w-5 h-5 fill-current" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex items-center gap-2 self-start ml-[44px]"> {/* Align with text */}
                        <div className="p-[12px_14px] rounded-[14px] bg-[#f1f5f9] flex items-center gap-2 rounded-tl-none">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-[#64748b]">Thinking...</span>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {showEmailPrompt && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mx-2 my-2 shadow-sm relative overflow-hidden group"
                        >
                            <h4 className="text-slate-800 font-bold text-sm mb-1.5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                Please identify yourself
                            </h4>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Enter your email to save this conversation and receive follow-up notes from our team.
                            </p>
                            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        required
                                        placeholder="your@email.com"
                                        value={emailInput}
                                        onChange={(e) => {
                                            setEmailInput(e.target.value);
                                            if (emailError) setEmailError(null);
                                        }}
                                        className={`flex-1 bg-white border rounded-lg px-3 py-2 text-sm outline-none transition-all ${emailError ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                                            }`}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-primary p-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                {emailError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[11px] text-red-500 font-medium px-1"
                                    >
                                        {emailError}
                                    </motion.p>
                                )}
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* .chat-input */}
            <div className="p-3 border-t border-[#e5e7eb] flex items-center gap-2 flex-shrink-0 bg-white">
                <form onSubmit={handleSend} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        placeholder={showEmailPrompt ? "Please provide your email above..." : "Ask me anything about AISiteGPT..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading || showEmailPrompt}
                        className="flex-1 p-[12px_14px] rounded-[12px] border border-[#e5e7eb] outline-none text-[14px] focus:border-primary transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading || showEmailPrompt}
                        className="w-[42px] h-[42px] bg-primary border-none rounded-[12px] cursor-pointer flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4 fill-current" />
                    </button>
                </form>
            </div>

            {/* .chat-footer */}
            <div className="text-center text-[12px] text-[#64748b] py-[6px] bg-white">
                Powered by 🤖 AISiteGPT
            </div>

        </div>
    );
};

export default ChatInterface;
