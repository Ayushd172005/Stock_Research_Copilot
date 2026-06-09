import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { chatApi } from '../utils/api'
import { useApp } from '../hooks/useAppContext'
import clsx from 'clsx'

const SUGGESTED = [
  "What was the total revenue and year-over-year growth?",
  "What are the key risks mentioned in this report?",
  "Summarize the CEO's message to shareholders",
  "What is the debt-to-equity ratio?",
  "What segments drove the most revenue?",
  "What is management's guidance for next year?",
]

function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-surface-border rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-surface-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded font-mono text-[10px]">
            [{index + 1}]
          </span>
          <span className="text-slate-400 font-medium">{source.company_name}</span>
          {source.page > 0 && (
            <span className="text-slate-600">· p.{source.page}</span>
          )}
          <span className="text-slate-600">
            · {Math.round(source.relevance_score * 100)}% match
          </span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-surface-border">
          <p className="text-slate-400 leading-relaxed font-mono">{source.chunk_text}</p>
        </div>
      )}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1',
        isUser ? 'bg-brand-500/20' : 'bg-emerald-500/20'
      )}>
        {isUser
          ? <User size={13} className="text-brand-400" />
          : <Bot size={13} className="text-emerald-400" />
        }
      </div>
      <div className={clsx('max-w-[85%]', isUser ? 'items-end' : 'items-start', 'flex flex-col gap-2')}>
        {isUser ? (
          <div className="bg-brand-500/15 border border-brand-500/25 rounded-2xl rounded-tr-sm px-4 py-2.5">
            <p className="text-sm text-slate-200">{msg.content}</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="text-sm text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.sources?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-border">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <BookOpen size={10} /> Sources
                </p>
                <div className="space-y-1.5">
                  {msg.sources.map((src, i) => (
                    <SourceCard key={i} source={src} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const { selectedDocs, documents } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedDocNames = documents
    .filter(d => selectedDocs.includes(d.doc_id))
    .map(d => d.company_name)

  const sendMessage = async (query) => {
    if (!query.trim() || loading) return
    if (selectedDocs.length === 0) return setError('Select at least one document from the sidebar')
    setError('')

    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await chatApi.query(query, selectedDocs, history)
      const { answer, sources } = res.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        sources,
      }])
    } catch (e) {
      const errMsg = e.response?.data?.detail || 'Failed to get response. Check backend connection.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error:** ${errMsg}`,
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Context bar */}
      {selectedDocs.length > 0 && (
        <div className="px-4 py-2.5 bg-brand-500/5 border-b border-brand-500/20 flex items-center gap-2">
          <BookOpen size={13} className="text-brand-400 flex-shrink-0" />
          <p className="text-xs text-brand-400">
            Analyzing: <span className="font-medium">{selectedDocNames.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5">
              <Bot size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to research</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-md">
              Select reports from the sidebar, then ask any question about the financials.
            </p>
            {selectedDocs.length > 0 && (
              <div className="w-full max-w-lg">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Suggested questions</p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-left text-sm text-slate-300 bg-surface-card border border-surface-border hover:border-brand-500/50 hover:text-white rounded-lg px-4 py-2.5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => <Message key={i} msg={msg} />)
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Bot size={13} className="text-emerald-400" />
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-surface-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={
              selectedDocs.length === 0
                ? 'Select a report to start asking questions...'
                : 'Ask about revenue, margins, risks, outlook...'
            }
            rows={1}
            className="flex-1 resize-none bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors leading-relaxed disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim() || selectedDocs.length === 0}
            className="w-11 h-11 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          Answers grounded in your uploaded reports · Press Enter to send
        </p>
      </div>
    </div>
  )
}
