import { useState } from 'react'
import { analysisApi } from '../utils/api'
import { useApp } from '../hooks/useAppContext'
import { GitCompare, Loader2, AlertCircle, CheckSquare, Square } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ComparePanel() {
  const { documents } = useApp()
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleDoc = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleCompare = async () => {
    if (selected.length < 2) return setError('Select at least 2 documents')
    setError('')
    setLoading(true)
    try {
      const res = await analysisApi.compare(selected)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const allMetrics = result?.comparison_table || []

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <GitCompare size={20} className="text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Company Comparison</h2>
        </div>

        {/* Document selection */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
            Select 2–5 reports to compare
          </h4>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No reports uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {documents.map(doc => {
                const sel = selected.includes(doc.doc_id)
                return (
                  <button
                    key={doc.doc_id}
                    onClick={() => toggleDoc(doc.doc_id)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      sel
                        ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                        : 'border-surface-border hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    {sel
                      ? <CheckSquare size={14} className="text-violet-400 flex-shrink-0" />
                      : <Square size={14} className="text-slate-600 flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.company_name}</p>
                      <p className="text-xs text-slate-500">{doc.year || 'N/A'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex-1">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          <button
            onClick={handleCompare}
            disabled={loading || selected.length < 2}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ml-auto"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
            Compare {selected.length > 0 ? `(${selected.length})` : ''} Companies
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={32} className="animate-spin text-violet-400 mb-4" />
            <p className="text-sm">Extracting and comparing financial data...</p>
            <p className="text-xs text-slate-600 mt-1">This may take 30–90 seconds</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            {/* Comparison table */}
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  Side-by-Side Metrics
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 uppercase tracking-wide">
                        Metric
                      </th>
                      {result.companies.map(c => (
                        <th key={c} className="text-left text-xs font-medium text-violet-400 px-5 py-3 uppercase tracking-wide">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allMetrics.map((row, i) => (
                      <tr key={i} className={`border-b border-surface-border/50 ${i % 2 === 0 ? 'bg-surface/30' : ''}`}>
                        <td className="px-5 py-3 text-slate-400 font-medium">{row.metric}</td>
                        {result.companies.map(c => (
                          <td key={c} className={`px-5 py-3 font-mono ${
                            row[c] === 'N/A' ? 'text-slate-600' : 'text-white'
                          }`}>
                            {row[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">AI Analysis</span>
                <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full">
                  GPT-powered
                </span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-5">
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-2">
                  Key Takeaway
                </p>
                <p className="text-sm text-slate-200">{result.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-20 text-slate-500">
            <GitCompare size={40} className="mx-auto mb-4 text-slate-700" />
            <p className="text-sm">Select 2 or more reports to compare companies head-to-head</p>
          </div>
        )}
      </div>
    </div>
  )
}
