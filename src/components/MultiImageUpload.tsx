'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface MultiImageUploadProps {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
}

export default function MultiImageUpload({ label, value, onChange }: MultiImageUploadProps) {
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

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la upload')
      }

      const { url } = await res.json()
      onChange([...value, url])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {value.map((url, i) => (
            <div key={i} className="relative inline-block">
              <Image
                src={url}
                alt={`Image ${i + 1}`}
                width={120}
                height={80}
                unoptimized
                className="rounded-lg object-cover border border-gray-200"
                style={{ width: 120, height: 80 }}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2">
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition ${
            uploading ? 'opacity-50 pointer-events-none' : 'text-gray-700'
          }`}
        >
          {uploading ? 'Se încarcă...' : 'Adaugă imagine'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
