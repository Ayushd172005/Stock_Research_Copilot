import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // 2min for LLM calls
})

export const documentsApi = {
  upload: (file, companyName, year, onProgress) => {
    const fd = new FormData()
    fd.append('file', file)
    if (companyName) fd.append('company_name', companyName)
    if (year) fd.append('year', year)
    return api.post('/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  list: () => api.get('/documents/'),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
}

export const chatApi = {
  query: (query, docIds, chatHistory = []) =>
    api.post('/chat/query', { query, doc_ids: docIds, chat_history: chatHistory }),
}

export const analysisApi = {
  getRatios: (docId) => api.get(`/analysis/${docId}/ratios`),
  getSummary: (docId) => api.get(`/analysis/${docId}/summary`),
  compare: (docIds, metrics) => api.post('/analysis/compare', { doc_ids: docIds, metrics }),
}

export default api
