'use client'

import { useState, useRef } from 'react'

interface PdfUploadProps {
  label: string
  value: string
  onChange: (key: string) => void
}

export default function PdfUpload({ label, value, onChange }: PdfUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la upload')
      }

      const { key } = await res.json()
      onChange(key)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
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
            PDF încărcat
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

      <div className="mt-2">
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition ${
            uploading ? 'opacity-50 pointer-events-none' : 'text-gray-700'
          }`}
        >
          {uploading ? 'Se încarcă...' : value ? 'Schimbă PDF-ul' : 'Alege PDF'}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">
          Sau lipește calea din Bunny Storage (pentru fișiere &gt; 4 MB)
        </label>
        <input
          type="text"
          placeholder="ex. guides/pdf/admin-ghid.pdf"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
        />
      </div>

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
