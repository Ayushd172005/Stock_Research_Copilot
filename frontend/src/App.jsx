import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { MessageSquare, BarChart2, FileText, GitCompare } from 'lucide-react'
import { AppProvider } from './hooks/useAppContext'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import RatiosPanel from './components/RatiosPanel'
import SummaryPanel from './components/SummaryPanel'
import ComparePanel from './components/ComparePanel'
import UploadModal from './components/UploadModal'
import clsx from 'clsx'

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-brand-400' },
  { id: 'ratios', label: 'Ratios', icon: BarChart2, color: 'text-amber-400' },
  { id: 'summary', label: 'Summary', icon: FileText, color: 'text-emerald-400' },
  { id: 'compare', label: 'Compare', icon: GitCompare, color: 'text-violet-400' },
]

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="flex h-screen bg-surface text-white overflow-hidden font-sans">
      <Sidebar onUploadClick={() => setShowUpload(true)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex items-center border-b border-surface-border bg-surface-card px-2">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all',
                  active
                    ? `border-current ${tab.color}`
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                )}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatPanel />}
          {activeTab === 'ratios' && <RatiosPanel />}
          {activeTab === 'summary' && <SummaryPanel />}
          {activeTab === 'compare' && <ComparePanel />}
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#141626',
            border: '1px solid #1e2235',
            color: '#e2e8f0',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
