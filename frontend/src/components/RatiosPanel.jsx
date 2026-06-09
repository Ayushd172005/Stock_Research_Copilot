import { useState } from 'react'
import { analysisApi } from '../utils/api'
import { useApp } from '../hooks/useAppContext'
import { BarChart2, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const METRIC_GROUPS = [
  {
    label: 'Income Statement',
    metrics: ['revenue', 'net_income', 'eps', 'gross_margin', 'operating_margin']
  },
  {
    label: 'Balance Sheet',
    metrics: ['debt_to_equity', 'current_ratio', 'quick_ratio']
  },
  {
    label: 'Returns',
    metrics: ['roe', 'roa', 'free_cash_flow']
  },
  {
    label: 'Valuation',
    metrics: ['pe_ratio']
  }
]

function MetricCard({ label, value }) {
  const isPercent = value && typeof value === 'string' && value.includes('%')
  const numVal = value ? parseFloat(value.replace(/[^0-9.-]/g, '')) : null
  const isPositive = numVal && numVal > 0
  
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">
        {label.replace(/_/g, ' ')}
      </p>
      <p className={`text-lg font-semibold ${value ? 'text-white' : 'text-slate-600'}`}>
        {value || 'N/A'}
      </p>
    </div>
  )
}

export default function RatiosPanel() {
  const { selectedDocs, documents } = useApp()
  const [ratios, setRatios] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDoc, setSelectedDoc] = useState('')

  const handleFetch = async () => {
    if (!selectedDoc) return setError('Select a document')
    setError('')
    setLoading(true)
    try {
      const res = await analysisApi.getRatios(selectedDoc)
      setRatios(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to extract ratios')
    } finally {
      setLoading(false)
    }
  }

  const allMetrics = ratios ? Object.entries(ratios)
    .filter(([k, v]) => !['company_name', 'year', 'raw_extracted'].includes(k) && v)
    .map(([k, v]) => ({ key: k, value: v }))
    : []

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 size={20} className="text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Financial Ratio Extractor</h2>
        </div>

        {/* Controls */}
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
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
            Extract Ratios
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {ratios && (
          <div>
            <div className="mb-5 pb-4 border-b border-surface-border">
              <h3 className="text-xl font-bold text-white">{ratios.company_name}</h3>
              {ratios.year && <p className="text-sm text-slate-400 mt-1">Fiscal Year {ratios.year}</p>}
            </div>

            {METRIC_GROUPS.map(group => {
              const groupMetrics = group.metrics
                .map(k => ({ key: k, value: ratios[k] }))
                .filter(m => m.value)
              
              if (groupMetrics.length === 0) return null
              
              return (
                <div key={group.label} className="mb-6">
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {groupMetrics.map(({ key, value }) => (
                      <MetricCard key={key} label={key} value={value} />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Bar chart for margins */}
            {(ratios.gross_margin || ratios.operating_margin || ratios.roe || ratios.roa) && (
              <div className="mt-6 bg-surface border border-surface-border rounded-xl p-5">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
                  Margin & Returns Overview
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Gross Margin', value: parseFloat((ratios.gross_margin || '0').replace(/[^0-9.-]/g, '')) || 0 },
                    { name: 'Op. Margin', value: parseFloat((ratios.operating_margin || '0').replace(/[^0-9.-]/g, '')) || 0 },
                    { name: 'ROE', value: parseFloat((ratios.roe || '0').replace(/[^0-9.-]/g, '')) || 0 },
                    { name: 'ROA', value: parseFloat((ratios.roa || '0').replace(/[^0-9.-]/g, '')) || 0 },
                  ].filter(d => d.value !== 0)}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141626', border: '1px solid #1e2235', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: '#60a5fa' }}
                      formatter={(v) => [`${v}%`, '']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[0, 1, 2, 3].map(i => (
                        <Cell key={i} fill={['#3b5bdb', '#10b981', '#f59e0b', '#8b5cf6'][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {!ratios && !loading && (
          <div className="text-center py-20 text-slate-500">
            <BarChart2 size={40} className="mx-auto mb-4 text-slate-700" />
            <p className="text-sm">Select a document and click "Extract Ratios"</p>
            <p className="text-xs text-slate-600 mt-1">AI will parse key financial metrics from the report</p>
          </div>
        )}
      </div>
    </div>
  )
}
