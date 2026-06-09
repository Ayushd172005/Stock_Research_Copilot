import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, FileText, Loader2 } from 'lucide-react'
import { useApp } from '../hooks/useAppContext'

export default function UploadModal({ onClose }) {
  const { uploadDocument } = useApp()
  const [file, setFile] = useState(null)
  const [company, setCompany] = useState('')
  const [year, setYear] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handleSubmit = async () => {
    if (!file) return setError('Please select a PDF file')
    setError('')
    setUploading(true)
    setProgress(0)

    try {
      await uploadDocument(
        file,
        company || undefined,
        year || undefined,
        (e) => setProgress(Math.round((e.loaded / e.total) * 100))
      )
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Check your API connection.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Upload Annual Report</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-4 ${
            isDragActive
              ? 'border-brand-500 bg-brand-500/5'
              : file
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-surface-border hover:border-slate-500'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-green-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white truncate max-w-[220px]">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
          ) : (
            <div>
              <Upload size={28} className="mx-auto text-slate-500 mb-3" />
              <p className="text-sm text-slate-300">Drop your PDF here, or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">Supports annual reports up to 50MB</p>
            </div>
          )}
        </div>

        {/* Optional fields */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Company Name (optional)</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Apple Inc."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Year (optional)</label>
            <input
              type="text"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="e.g. 2023"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            {error}
          </p>
        )}

        {uploading && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Uploading & indexing...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 text-sm text-slate-400 border border-surface-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file}
            className="flex-1 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : 'Upload & Index'}
          </button>
        </div>
      </div>
    </div>
  )
}
