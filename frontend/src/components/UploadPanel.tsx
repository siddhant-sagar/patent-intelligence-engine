import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Link, Sparkles, AlertCircle, X, Upload } from 'lucide-react'
import axios from 'axios'

const SAMPLE_URL = 'https://patents.google.com/patent/US10625776B2'
const API_BASE = import.meta.env.VITE_API_URL || ''

interface UploadPanelProps {
  onJobStart: (jobId: string) => void
  isRunning: boolean
  onReset: () => void
}

export default function UploadPanel({ onJobStart, isRunning, onReset }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setUrl('')
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isRunning,
  })

  const handleUrlChange = (val: string) => {
    setUrl(val)
    if (val) setFile(null)
    setError(null)
  }

  const handleLoadSample = () => {
    setUrl(SAMPLE_URL)
    setFile(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!file && !url.trim()) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        formData.append('patent_url', url.trim())
      }

      const response = await axios.post(`${API_BASE}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { job_id } = response.data as { job_id: string }
      onJobStart(job_id)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { detail?: string })?.detail
        setError(msg || `Server error: ${err.response?.status || 'unknown'}`)
      } else {
        setError('Failed to connect to backend. Make sure it is running on port 8000.')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasInput = Boolean(file || url.trim())
  const isDisabled = !hasInput || loading || isRunning

  return (
    <div className="space-y-4">
      {/* Reset button when running */}
      {isRunning && (
        <div className="flex items-center justify-between p-3 bg-brand-purple/10 border border-brand-purple/30
                        rounded-xl text-sm text-brand-purple">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
            Analysis in progress...
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 group
          ${isDragActive
            ? 'border-brand-purple bg-brand-purple/10'
            : file
            ? 'border-brand-purple/60 bg-brand-purple/5'
            : 'border-dark-border hover:border-brand-purple/50 hover:bg-dark-card/50'
          }
          ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center">
                <FileText size={24} className="text-brand-purple" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{file.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                </p>
              </div>
              {!isRunning && (
                <button
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Remove
                </button>
              )}
            </>
          ) : (
            <>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                ${isDragActive ? 'bg-brand-purple/20' : 'bg-dark-border group-hover:bg-brand-purple/10'}`}>
                <Upload size={22} className={isDragActive ? 'text-brand-purple' : 'text-gray-500 group-hover:text-brand-purple/80'} />
              </div>
              <div>
                <p className="text-gray-300 font-medium text-sm">
                  {isDragActive ? 'Drop your patent PDF here' : 'Drop patent PDF here or click to browse'}
                </p>
                <p className="text-gray-600 text-xs mt-1">PDF format · Max 20MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-dark-border" />
        <span className="text-gray-600 text-xs font-medium tracking-wider">OR</span>
        <div className="flex-1 h-px bg-dark-border" />
      </div>

      {/* URL input */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-400">
          Google Patents URL
        </label>
        <div className="relative">
          <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="url"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://patents.google.com/patent/US..."
            disabled={isRunning}
            className="w-full pl-9 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg
                       text-sm text-gray-200 placeholder-gray-600
                       focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50
                       disabled:opacity-50 transition-all"
          />
        </div>
      </div>

      {/* Sample patent button */}
      <button
        onClick={handleLoadSample}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                   border border-dark-border rounded-lg text-sm text-gray-400
                   hover:border-brand-purple/40 hover:text-brand-purple hover:bg-brand-purple/5
                   disabled:opacity-50 transition-all duration-200"
      >
        <Sparkles size={14} />
        Load Sample Patent
        <span className="text-xs text-gray-600">Honda Driving Assist · US10625776B2</span>
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-900/20 border border-red-800/40
                        rounded-xl text-red-400 text-sm animate-fade-in">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
          flex items-center justify-center gap-2
          ${isDisabled
            ? 'bg-dark-border text-gray-600 cursor-not-allowed'
            : 'bg-brand-purple hover:bg-brand-purple-dim text-white shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50'
          }
        `}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting analysis...
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Analyze Patent
          </>
        )}
      </button>
    </div>
  )
}
