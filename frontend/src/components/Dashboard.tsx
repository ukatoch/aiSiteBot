import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    Globe,
    MessageSquare,
    Database,
    LogOut,
    Bot,
    Users,
    Clock,
    Menu,
    X,
    Trash2,
    FileText,
    Link,
    Zap,
    Paintbrush,
    History,
    Settings,
    MoreVertical,
    Star,
    CheckCheck,
    Search,
    Filter,
    ChevronDown,
    Mail,
    Phone,
    ArrowLeft,
    Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataIngestion from './DataIngestion';
import { cn } from '../lib/utils';

interface Domain {
    id: number;
    hostname: string;
    bot_id: string;
}

interface Metrics {
    chats_count: number;
    sources_count: number;
}

const Dashboard: React.FC = () => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'leads' | 'resources' | 'settings'>('stats');
    const [leads, setLeads] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const domainRes = await axios.get('/api/v1/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDomains(domainRes.data);
            if (domainRes.data.length > 0) {
                setSelectedDomain(domainRes.data[0]);
            }
        } catch (err) {
            console.error(err);
            navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMetrics = async (domainId: number) => {
        const token = localStorage.getItem('token');
        try {
            const metricRes = await axios.get(`/api/v1/dashboard/${domainId}/metrics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMetrics(metricRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLeads = async (domainId?: number) => {
        const token = localStorage.getItem('token');
        try {
            const url = domainId
                ? `/api/v1/dashboard/leads?domain_id=${domainId}`
                : '/api/v1/dashboard/leads';
            const leadsRes = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(leadsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDocuments = async (domainId: number) => {
        const token = localStorage.getItem('token');
        try {
            const docRes = await axios.get(`/api/v1/dashboard/${domainId}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(docRes.data.documents);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const deleteDocument = async (source: string) => {
        if (!window.confirm(`Are you sure you want to delete "${source}"?`)) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/v1/dashboard/${selectedDomain?.id}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { source }
            });
            if (selectedDomain) {
                fetchDocuments(selectedDomain.id);
                fetchMetrics(selectedDomain.id);
            }
        } catch (err) {
            console.error('Failed to delete document:', err);
            alert('Failed to delete document. Please try again.');
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (selectedDomain) {
            // Reset selected lead when domain changes
            setSelectedLead(null);
            setShowDetails(false);

            fetchMetrics(selectedDomain.id);
            fetchLeads(selectedDomain.id);
            fetchDocuments(selectedDomain.id);
        }
    }, [selectedDomain]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden font-sans text-slate-900">
            {/* Top Navigation */}
            <header className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-500"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('stats')}>
                        <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight hidden sm:inline-block">SiteGPT</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-6">
                        {['Chatbots', 'Demo', 'Plans & Billing', 'Account Usage', 'Profile'].map((item) => (
                            <button key={item} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <select
                            className="bg-transparent text-sm font-medium outline-none"
                            onChange={(e) => {
                                const domain = domains.find(d => d.id === parseInt(e.target.value));
                                if (domain) setSelectedDomain(domain);
                            }}
                            value={selectedDomain?.id}
                        >
                            {domains.map(d => (
                                <option key={d.id} value={d.id}>{d.hostname}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-[2px] transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed md:relative z-40 h-full w-64 bg-white border-r border-slate-100 flex flex-col pt-4 shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="px-3 mb-6">
                        <SidebarItem
                            icon={<LayoutDashboard className="w-4 h-4" />}
                            label="Dashboard"
                            active={activeTab === 'stats'}
                            onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
                        />
                    </div>

                    <div className="px-3 mb-6">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Content</p>
                        <SidebarItem icon={<Database className="w-4 h-4" />} label="Data Sources" active={activeTab === 'resources'} onClick={() => { setActiveTab('resources'); setIsSidebarOpen(false); }} />
                    </div>



                    <div className="px-3 mb-4">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Advanced</p>
                        <SidebarItem
                            icon={<History className="w-4 h-4" />}
                            label="Chat History"
                            active={activeTab === 'leads'}
                            onClick={() => { setActiveTab('leads'); setIsSidebarOpen(false); }}
                            badge={leads.length || 0}
                        />
                        <SidebarItem icon={<Settings className="w-4 h-4" />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
                    </div>
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 overflow-hidden flex">
                    {activeTab === 'stats' && (
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Domain Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatCard
                                    title="Total Conversations"
                                    value={metrics?.chats_count || 0}
                                    icon={<MessageSquare className="w-6 h-6 text-blue-500" />}
                                />
                                <StatCard
                                    title="Sources Trained"
                                    value={metrics?.sources_count || 0}
                                    icon={<Database className="w-6 h-6 text-emerald-500" />}
                                />
                                <StatCard
                                    title="Active Leads"
                                    value={leads.length}
                                    icon={<Users className="w-6 h-6 text-indigo-500" />}
                                />
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="font-bold text-slate-900 mb-4">Instance Details</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-3 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Bot ID</span>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{selectedDomain?.bot_id}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Hostname</span>
                                        <span className="text-sm font-medium">{selectedDomain?.hostname}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-slate-50">
                                        <span className="text-slate-500 text-sm">Status</span>
                                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'leads' && (
                        <div className="flex-1 flex overflow-hidden relative">
                            {/* List of Leads */}
                            <div className={cn(
                                "w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 bg-white z-10 transition-all",
                                selectedLead && "hidden md:flex"
                            )}>
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">Conversations</span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-1.5 hover:bg-slate-50 rounded"><Filter className="w-4 h-4 text-slate-500" /></button>
                                        <button className="p-1.5 hover:bg-slate-50 rounded"><Search className="w-4 h-4 text-slate-500" /></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {leads.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-sm">No leads captured yet.</div>
                                    ) : leads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setShowDetails(false);
                                            }}
                                            className={cn(
                                                "p-4 border-b border-slate-50 cursor-pointer transition-colors",
                                                selectedLead?.id === lead.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                                                    {lead.user_email[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between mb-0.5">
                                                        <p className="text-sm font-bold truncate pr-2">{lead.user_email.split('@')[0]}</p>
                                                        <span className="text-[10px] text-slate-400 shrink-0">
                                                            {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {lead.messages?.length > 0 ? lead.messages[lead.messages.length - 1].content : 'No messages'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat View */}
                            <div className={cn(
                                "flex-1 flex flex-col min-w-0 bg-white transition-all",
                                !selectedLead && "hidden md:flex"
                            )}>
                                {selectedLead ? (
                                    <>
                                        <header className="h-14 border-b border-slate-100 flex items-center justify-between px-4 md:px-6 shrink-0 bg-white">
                                            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                                <button
                                                    onClick={() => setSelectedLead(null)}
                                                    className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 mr-1"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-[10px] shrink-0">
                                                    {selectedLead.user_email[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2 overflow-hidden">
                                                    <span className="text-sm font-bold truncate">{selectedLead.user_email.split('@')[0]}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                        <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Open</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 md:gap-3">
                                                <button onClick={() => setShowDetails(!showDetails)} className={cn(
                                                    "p-2 rounded-lg transition-colors xl:hidden",
                                                    showDetails ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"
                                                )}>
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                <Star className="w-4 h-4 text-slate-400 cursor-pointer hidden sm:block" />
                                                <CheckCheck className="w-4 h-4 text-blue-500 cursor-pointer hidden sm:block" />
                                                <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                                            </div>
                                        </header>
                                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                                            <div className="flex justify-center mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/0 px-3">
                                                    {new Date(selectedLead.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {selectedLead.messages.map((msg: any, i: number) => (
                                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
                                                    <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                                        {msg.role === 'user' ? 'User' : 'Bot'}
                                                    </p>
                                                    <div className={cn(
                                                        "max-w-[90%] md:max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed",
                                                        msg.role === 'user'
                                                            ? 'bg-slate-100 text-slate-900 rounded-tl-none'
                                                            : 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-300 flex-col gap-3 p-8 text-center">
                                        <MessageSquare className="w-12 h-12 opacity-50" />
                                        <p className="text-sm font-medium">Select a conversation to view details</p>
                                    </div>
                                )}
                            </div>

                            {/* Details Pane */}
                            <div className={cn(
                                "fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-100 p-6 flex flex-col overflow-y-auto shrink-0 shadow-2xl transition-transform duration-300 z-50",
                                "xl:static xl:shadow-none xl:translate-x-0 xl:bg-slate-50/30",
                                showDetails ? "translate-x-0" : "translate-x-full xl:translate-x-0",
                                !selectedLead && "hidden"
                            )}>
                                {selectedLead && (
                                    <>
                                        <div className="flex items-center justify-between mb-8 xl:hidden">
                                            <h3 className="font-bold">Conversation Details</h3>
                                            <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>


                                        <div className="mb-8 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-2 overflow-hidden">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Summary</p>
                                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                                                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></span>
                                                    AI Generated
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                                User is inquiring about integration capabilities and pricing.
                                            </p>
                                        </div>

                                        <div className="mb-8">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Conversation Details</p>
                                            <div className="space-y-4">
                                                <DetailItem icon={<Paintbrush className="w-3 h-3" />} label="Tone" value="Professional" />
                                                <DetailItem icon={<MessageSquare className="w-3 h-3" />} label="Total Messages" value={selectedLead.messages.length} />
                                                <DetailItem icon={<Zap className="w-3 h-3" />} label="ID" value={`#${selectedLead.id.slice(0, 5)}`} />
                                                <DetailItem icon={<Clock className="w-3 h-3" />} label="Started On" value={new Date(selectedLead.created_at).toLocaleDateString()} />
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">User Details</p>
                                            <div className="space-y-4">
                                                <DetailItem icon={<Mail className="w-3 h-3" />} label="Email" value={selectedLead.user_email} />
                                                <DetailItem icon={<Phone className="w-3 h-3" />} label="Phone" value="Not provided" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <header className="mb-8">
                                    <h2 className="text-2xl font-bold text-slate-900">Data Sources</h2>
                                    <p className="text-sm text-slate-500">Train your bot by adding URLs or uploading files for {selectedDomain?.hostname}</p>
                                </header>

                                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
                                    <DataIngestion
                                        botId={selectedDomain?.bot_id}
                                        hostname={selectedDomain?.hostname}
                                        showSourcesList={false}
                                        onIngestSuccess={() => {
                                            if (selectedDomain) {
                                                fetchDocuments(selectedDomain.id);
                                                fetchMetrics(selectedDomain.id);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Database className="w-4 h-4 text-blue-600" />
                                            Active Knowledge Base
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                                            {documents.length} DOCUMENTS
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Source Type</th>
                                                    <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Resource Name</th>
                                                    <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {documents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                                                            No data sources added yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    documents.map((doc, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${doc.type === 'url' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                                    }`}>
                                                                    {doc.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                                        {doc.type === 'url' ? <Link className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[150px] sm:max-w-sm">{doc.source}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => deleteDocument(doc.source)}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, label, active = false, onClick, disabled = false, badge = 0 }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${disabled ? 'opacity-40 cursor-not-allowed' :
            active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
        </div>
        {badge > 0 && (
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
        )}
    </button>
);

const DetailItem = ({ icon, label, value }: any) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 uppercase text-[9px] font-bold">
            {icon}
            <span>{label}</span>
        </div>
        <span className="text-[11px] font-bold text-slate-900">{value}</span>
    </div>
);

const StatCard = ({ title, value, icon }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform">
        <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
            {icon}
        </div>
    </div>
);

export default Dashboard;
