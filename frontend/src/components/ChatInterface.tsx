import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, MoreVertical, MessageSquare, Loader2, User, Bot, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface ChatInterfaceProps {
    onManageSources: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onManageSources }) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '👋 Hi, I’m the AISiteGPT Assistant — built with AISiteGPT itself.'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage = { role: 'user' as const, content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/v1/chat', { query: userMessage.content });
            const botMessage = {
                role: 'assistant' as const,
                content: response.data.answer,
                sources: response.data.sources
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = { role: 'assistant' as const, content: 'Sorry, I ran into an issue. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">

            {/* .chat-header */}
            <div className="flex items-center gap-3 p-[14px_16px] border-b border-[#e5e7eb] flex-shrink-0 relative z-10">
                <div className="w-[36px] h-[36px] bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div className="font-semibold text-slate-800 flex-1">
                    AISiteGPT Assistant
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-[#64748b] hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 origin-top-right"
                                style={{ right: 0, marginRight: '8px' }}
                            >
                                <button
                                    onClick={() => {
                                        onManageSources();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 border-b border-slate-50"
                                >
                                    <Database className="w-4 h-4" />
                                    Data Sources
                                </button>
                                <button
                                    onClick={() => {
                                        setMessages([messages[0]]); // Keep only welcome message
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Restart Chat
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
            </div>

            {/* .chat-input */}
            <div className="p-3 border-t border-[#e5e7eb] flex items-center gap-2 flex-shrink-0 bg-white">
                <form onSubmit={handleSend} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask me anything about AISiteGPT..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 p-[12px_14px] rounded-[12px] border border-[#e5e7eb] outline-none text-[14px] focus:border-primary transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="w-[42px] h-[42px] bg-primary border-none text-white rounded-[12px] cursor-pointer flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
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
