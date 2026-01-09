import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Globe, Loader2, CheckCircle, AlertCircle, FileText, Plus, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface DataIngestionProps {
    onIngestSuccess: () => void;
}

const DataIngestion: React.FC<DataIngestionProps> = ({ onIngestSuccess }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [documents, setDocuments] = useState<{ source: string; type: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/documents');
            setDocuments(response.data.documents);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    };

    React.useEffect(() => {
        fetchDocuments();
    }, [onIngestSuccess]); // Re-fetch when parent signals success (or just on mount)

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setIsLoading(true);
        setStatus(null);
        try {
            await axios.post('http://localhost:8000/api/v1/ingest/url', { url });
            setStatus({ type: 'success', message: 'URL trained successfully!' });
            setUrl('');
            onIngestSuccess();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Failed to ingest URL.';
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

        try {
            await axios.post('http://localhost:8000/api/v1/ingest/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStatus({ type: 'success', message: `File ${file.name} trained successfully!` });
            onIngestSuccess();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Failed to ingest file.';
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

                <div className="border rounded-xl p-5 mb-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                        Add website URL
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button type="submit"
                            disabled={isLoading || !url} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <p>Add</p>}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        We’ll automatically crawl and extract content.
                    </p>
                </div>

                {/* Files Card */}
                <div className="border-2 border-dashed rounded-xl p-6 text-center mb-2 hover:border-blue-500 transition">
                    {/* <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>*/}
                    <h3 className="font-semibold text-slate-900">Files</h3>
                    <p className="text-sm text-slate-500 mb-4">Upload PDF or Text files for training.</p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
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

            {/* List of Sources */}
            <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Active Sources</h4>

                {documents.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-sm">
                        <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p>No sources added yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Websites Section */}
                        {documents.some(d => d.type === 'url') && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Websites</h5>
                                {documents.filter(d => d.type === 'url').map((doc, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Globe className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate" title={doc.source}>
                                                {doc.source}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Files Section */}
                        {documents.some(d => d.type !== 'url') && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</h5>
                                {documents.filter(d => d.type !== 'url').map((doc, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate" title={doc.source}>
                                                {doc.source}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize">{doc.type}</p>
                                        </div>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>


    );
};

export default DataIngestion;

