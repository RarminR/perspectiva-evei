'use client'

import { useState, useRef } from 'react'

interface AudioUploadProps {
  label: string
  value: string
  onChange: (key: string) => void
}

export default function AudioUpload({ label, value, onChange }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      const result = await new Promise<{ key: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error || 'Eroare la upload'))
            } catch {
              reject(new Error('Eroare la upload'))
            }
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Eroare de rețea')))
        xhr.open('POST', '/api/admin/upload-audio')
        xhr.send(formData)
      })

      onChange(result.key)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    onChange('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {value ? (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Audio încărcat
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-500 text-sm hover:text-red-700 transition"
          >
            Șterge
          </button>
        </div>
      ) : null}

      {uploading && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#a007dc] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}

      <div className="mt-2">
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition ${
            uploading ? 'opacity-50 pointer-events-none' : 'text-gray-700'
          }`}
        >
          {uploading ? 'Se încarcă...' : value ? 'Schimbă audio' : 'Alege fișier audio'}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
