import { useState } from 'react'
import DataIngestion from './components/DataIngestion'
import ChatInterface from './components/ChatInterface'
import { MessagesSquare, Menu, X, Settings, Database, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from './lib/utils'

function App() {
  const [, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'sources'>('chat');

  const handleIngestSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center font-sans text-[#0f172a]">

      {/* .chat-container */}
      <div
        className="w-full h-[100dvh] min-[480px]:w-full min-[480px]:max-w-[420px] min-[480px]:h-[90vh] bg-white min-[480px]:rounded-[18px] flex flex-col overflow-hidden relative"
        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      >

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'chat' ? (
            <ChatInterface onManageSources={() => setActiveTab('sources')} />
          ) : (
            <div className="h-full w-full overflow-y-auto pt-4 px-4 bg-white relative flex flex-col">
              <div className="p-[14px] border-b border-[#e5e7eb] flex items-center gap-3">
                <button onClick={() => setActiveTab('chat')} className="p-1 hover:bg-slate-100 rounded-full">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="font-semibold text-[#0f172a]">Data Sources</h3>
              </div>
              <div className="flex-1 p-4">
                <DataIngestion onIngestSuccess={handleIngestSuccess} />
              </div>
            </div>
          )}
        </div>

        {/* Hidden Nav Toggle (Bottom Right Corner for Demo) */}
        <div className="absolute bottom-1 right-1 z-50 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={() => setActiveTab(prev => prev === 'chat' ? 'sources' : 'chat')} className="p-2 text-slate-300 hover:text-slate-500">
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}

export default App

