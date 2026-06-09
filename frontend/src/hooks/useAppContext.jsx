import { createContext, useContext, useState, useCallback } from 'react'
import { documentsApi } from '../utils/api'
import toast from 'react-hot-toast'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [documents, setDocuments] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [loading, setLoading] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      const res = await documentsApi.list()
      setDocuments(res.data)
    } catch (e) {
      toast.error('Failed to load documents')
    }
  }, [])

  const uploadDocument = useCallback(async (file, company, year, onProgress) => {
    try {
      const res = await documentsApi.upload(file, company, year, onProgress)
      setDocuments(prev => [...prev, res.data])
      toast.success(`${res.data.company_name} uploaded successfully`)
      return res.data
    } catch (e) {
      const msg = e.response?.data?.detail || 'Upload failed'
      toast.error(msg)
      throw e
    }
  }, [])

  const deleteDocument = useCallback(async (docId) => {
    try {
      await documentsApi.delete(docId)
      setDocuments(prev => prev.filter(d => d.doc_id !== docId))
      setSelectedDocs(prev => prev.filter(id => id !== docId))
      toast.success('Document deleted')
    } catch (e) {
      toast.error('Failed to delete document')
    }
  }, [])

  const toggleDocSelection = useCallback((docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }, [])

  return (
    <AppContext.Provider value={{
      documents,
      selectedDocs,
      loading,
      setLoading,
      loadDocuments,
      uploadDocument,
      deleteDocument,
      toggleDocSelection,
      setSelectedDocs,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
