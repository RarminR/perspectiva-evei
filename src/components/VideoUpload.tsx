'use client'

import { useState, useRef } from 'react'

interface VideoUploadProps {
  label?: string
  value: string | null
  onChange: (videoId: string | null) => void
}

export function VideoUpload({ label = 'Video', value, onChange }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Te rog selectează un fișier video')
      return
    }

    setUploading(true)
    setError('')
    setProgress(0)
    setStatus('Se creează intrarea video...')

    try {
      // Step 1: Create video entry on our server
      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: file.name }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la crearea video')
      }

      const { videoId, libraryId, tusEndpoint, authSignature, authExpire } = await res.json()

      setStatus('Se încarcă videoclipul...')

      // Step 2: Upload directly to Bunny via TUS protocol (plain XHR, no library)
      // TUS creation request
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      await new Promise<void>((resolve, reject) => {
        xhr.open('POST', tusEndpoint, true)
        xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream')
        xhr.setRequestHeader('Upload-Length', String(file.size))
        xhr.setRequestHeader('Upload-Offset', '0')
        xhr.setRequestHeader('AuthorizationSignature', authSignature)
        xhr.setRequestHeader('AuthorizationExpire', String(authExpire))
        xhr.setRequestHeader('VideoId', videoId)
        xhr.setRequestHeader('LibraryId', libraryId)
        xhr.setRequestHeader('Upload-Metadata', `filetype ${btoa(file.type)},title ${btoa(file.name)}`)
        xhr.setRequestHeader('Tus-Resumable', '1.0.0')

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload eșuat: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Eroare de rețea la încărcare'))
        xhr.onabort = () => reject(new Error('Încărcare anulată'))

        xhr.send(file)
      })

      setUploading(false)
      setProgress(100)
      setStatus('')
      onChange(videoId)
    } catch (err) {
      if ((err as Error).message !== 'Încărcare anulată') {
        setError(err instanceof Error ? err.message : 'Eroare la încărcare')
      }
      setUploading(false)
      setStatus('')
    }
  }

  function handleCancel() {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    setUploading(false)
    setProgress(0)
    setStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemove() {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {value && !uploading && (
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Video încărcat
          </span>
          <span className="text-xs text-gray-400 font-mono">{value}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            Șterge
          </button>
        </div>
      )}

      {uploading && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>{status}</span>
            <div className="flex items-center gap-2">
              <span>{progress}%</span>
              <button
                type="button"
                onClick={handleCancel}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Anulează
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#51087e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {!uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {value ? 'Schimbă videoclipul' : 'Alege videoclip'}
        </button>
      )}

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
