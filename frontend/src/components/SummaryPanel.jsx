import { useState } from 'react'
import { analysisApi } from '../utils/api'
import { useApp } from '../hooks/useAppContext'
import { FileText, Loader2, AlertCircle, TrendingUp, TrendingDown, Zap, Shield } from 'lucide-react'

export default function SummaryPanel() {
  const { documents } = useApp()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDoc, setSelectedDoc] = useState('')

  const handleFetch = async () => {
    if (!selectedDoc) return setError('Select a document')
    setError('')
    setLoading(true)
    try {
      const res = await analysisApi.getSummary(selectedDoc)
      setSummary(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Earnings Summary</h2>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={selectedDoc}
            onChange={e => setSelectedDoc(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 appearance-none"
          >
            <option value="">Select a report...</option>
            {documents.map(d => (
              <option key={d.doc_id} value={d.doc_id}>
                {d.company_name} {d.year && `(${d.year})`}
              </option>
            ))}
          </select>
          <button
            onClick={handleFetch}
            disabled={loading || !selectedDoc}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Generate Summary
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin text-emerald-400 mb-4" />
            <p className="text-sm">AI is reading and summarizing the report...</p>
            <p className="text-xs text-slate-600 mt-1">This may take 20-60 seconds</p>
          </div>
        )}

        {summary && !loading && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-white">{summary.company_name}</h3>
                  {summary.year && <p className="text-sm text-slate-400 mt-0.5">FY {summary.year} Annual Report</p>}
                </div>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full font-medium">
                  AI Summary
                </span>
              </div>
              <p className="text-base text-slate-200 font-medium italic mt-4 border-l-2 border-brand-500 pl-4">
                "{summary.headline}"
              </p>
            </div>

            {/* Full summary */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">Overview</h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{summary.full_summary}</p>
            </div>

            {/* Highlights */}
            {summary.key_highlights?.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} className="text-emerald-400" />
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest">Key Highlights</h4>
                </div>
                <ul className="space-y-2.5">
                  {summary.key_highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.risks?.length > 0 && (
                <div className="bg-surface-card border border-red-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={14} className="text-red-400" />
                    <h4 className="text-xs font-medium text-red-400 uppercase tracking-widest">Key Risks</h4>
                  </div>
                  <ul className="space-y-2">
                    {summary.risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-red-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.opportunities?.length > 0 && (
                <div className="bg-surface-card border border-emerald-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={14} className="text-emerald-400" />
                    <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Opportunities</h4>
                  </div>
                  <ul className="space-y-2">
                    {summary.opportunities.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Outlook */}
            {summary.management_outlook && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
                  Management Outlook
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">{summary.management_outlook}</p>
              </div>
            )}
          </div>
        )}

        {!summary && !loading && (
          <div className="text-center py-20 text-slate-500">
            <FileText size={40} className="mx-auto mb-4 text-slate-700" />
            <p className="text-sm">Select a document to generate an AI-powered earnings summary</p>
          </div>
        )}
      </div>
    </div>
  )
}
