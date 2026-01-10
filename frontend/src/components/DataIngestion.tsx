import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Globe, Loader2, CheckCircle, AlertCircle, FileText, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface DataIngestionProps {
    onIngestSuccess: () => void;
    botId?: string;
    hostname?: string;
    showSourcesList?: boolean;
}

const DataIngestion: React.FC<DataIngestionProps> = ({
    onIngestSuccess,
    botId = 'bot-default',
    hostname = window.location.hostname,
    showSourcesList = true
}) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);



    // Clear status after a delay (longer for errors)
    React.useEffect(() => {
        if (status) {
            const delay = status.type === 'error' ? 5000 : 3000;
            const timer = setTimeout(() => setStatus(null), delay);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Clear status on domain/bot change
    React.useEffect(() => {
        setStatus(null);
    }, [botId, hostname]);

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        // Check for multiple URLs
        const trimmedUrl = url.trim();
        if (trimmedUrl.includes(' ') || trimmedUrl.includes(',') || trimmedUrl.includes('\n')) {
            setStatus({
                type: 'error',
                message: 'Please enter only one URL at a time'
            });
            return;
        }

        // Basic URL validation
        const urlPattern = /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
        if (!urlPattern.test(trimmedUrl)) {
            setStatus({
                type: 'error',
                message: 'Please enter a valid URL (e.g., https://example.com)'
            });
            return;
        }

        setIsLoading(true);
        setStatus(null);
        try {
            await axios.post('/api/v1/ingest/url', {
                url: trimmedUrl,
                botId,
                hostname
            });
            setStatus({ type: 'success', message: 'URL trained successfully!' });
            setUrl('');
            try {
                onIngestSuccess();
            } catch (callbackError) {
                console.error('Error in onIngestSuccess callback:', callbackError);
            }
        } catch (error: any) {
            console.error('URL ingestion error:', error);
            let msg = 'Failed to ingest URL.';

            if (error.response?.data?.detail) {
                msg = error.response.data.detail;
            } else if (error.response?.status === 404) {
                msg = 'Domain not found. Please check your configuration.';
            } else if (error.response?.status === 500) {
                msg = 'Server error. The URL might be invalid or unreachable.';
            } else if (error.message) {
                msg = error.message;
            } else if (error.code === 'ERR_NETWORK') {
                msg = 'Network error. Please check your connection and try again.';
            }

            setStatus({ type: 'error', message: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setStatus(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('botId', botId);
        formData.append('hostname', hostname);

        try {
            await axios.post('/api/v1/ingest/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStatus({ type: 'success', message: `File ${file.name} trained successfully!` });
            try {
                onIngestSuccess();
            } catch (callbackError) {
                console.error('Error in onIngestSuccess callback:', callbackError);
            }
        } catch (error: any) {
            console.error(error);
            let msg = 'Failed to ingest file.';

            if (error.response?.data?.detail) {
                msg = error.response.data.detail;
            } else if (error.message) {
                msg = error.message;
            } else if (error.code === 'ERR_NETWORK') {
                msg = 'Network error. Please check your connection and try again.';
            }

            setStatus({ type: 'error', message: msg });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-1">

                {/* Website Card */}
                {/*<div className="border rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Website</h3>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                        Add website URL
                    </p>

                    <form onSubmit={handleUrlSubmit} className="relative mt-2">
                        <input
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !url}
                            className="absolute right-1.5 top-1.5 p-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        </button>
                    </form>
                </div>*/}

                <form onSubmit={handleUrlSubmit} className="border rounded-xl p-5 mb-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                        Add website URL
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setStatus(null);
                            }}
                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button type="submit"
                            disabled={isLoading || !url} className="px-4 py-2 bg-blue-600 rounded-xl text-sm">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <p>Add</p>}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        We’ll automatically crawl and extract content.
                    </p>
                </form>

                {/* Files Card */}
                <div className="border-2 border-dashed rounded-xl p-6 text-center mb-2 hover:border-blue-500 transition">
                    {/* <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>*/}
                    <h3 className="font-semibold text-slate-900">Files</h3>
                    <p className="text-sm text-slate-500 mb-4">Upload PDF or Text files for bot training.</p>

                    <button
                        onClick={() => {
                            setStatus(null);
                            fileInputRef.current?.click();
                        }}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload Document
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            </div>



            {/* Status Message */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "p-4 rounded-lg flex items-center gap-3 border shadow-sm",
                            status.type === 'success'
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                        )}
                    >
                        {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <div>
                            <h4 className="font-semibold text-sm">{status.type === 'success' ? 'Training Complete' : 'Training Failed'}</h4>
                            <p className="text-sm opacity-90">{status.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>


    );
};

export default DataIngestion;

