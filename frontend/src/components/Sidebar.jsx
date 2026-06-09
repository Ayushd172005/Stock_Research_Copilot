import { useEffect, useState } from 'react'
import { useApp } from '../hooks/useAppContext'
import { FileText, Trash2, CheckSquare, Square, TrendingUp, Upload, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

export default function Sidebar({ onUploadClick }) {
  const { documents, selectedDocs, toggleDocSelection, deleteDocument, loadDocuments } = useApp()
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { loadDocuments() }, [])

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    setDeleting(docId)
    await deleteDocument(docId)
    setDeleting(null)
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-wide">
            Stock Research Copilot
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 ml-11">AI-powered annual report analysis</p>
      </div>

      {/* Upload button */}
      <div className="p-4">
        <button
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Upload size={15} />
          Upload Annual Report
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Reports ({documents.length})
          </span>
          <button onClick={loadDocuments} className="text-slate-500 hover:text-slate-300 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText size={28} className="mx-auto text-slate-600 mb-3" />
            <p className="text-xs text-slate-500">No reports uploaded yet.</p>
            <p className="text-xs text-slate-600 mt-1">Upload a PDF to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map(doc => {
              const selected = selectedDocs.includes(doc.doc_id)
              return (
                <div
                  key={doc.doc_id}
                  onClick={() => toggleDocSelection(doc.doc_id)}
                  className={clsx(
                    'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
                    selected
                      ? 'bg-brand-500/10 border border-brand-500/30'
                      : 'hover:bg-surface-hover border border-transparent'
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {selected
                      ? <CheckSquare size={15} className="text-brand-500" />
                      : <Square size={15} className="text-slate-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm font-medium truncate',
                      selected ? 'text-brand-400' : 'text-slate-300'
                    )}>
                      {doc.company_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{doc.year}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{doc.pages}p</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{doc.chunks} chunks</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc.doc_id)}
                    disabled={deleting === doc.doc_id}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {selectedDocs.length > 0 && (
        <div className="p-4 border-t border-surface-border">
          <p className="text-xs text-slate-400">
            <span className="text-brand-400 font-medium">{selectedDocs.length}</span> report{selectedDocs.length > 1 ? 's' : ''} selected for analysis
          </p>
        </div>
      )}
    </aside>
  )
}
