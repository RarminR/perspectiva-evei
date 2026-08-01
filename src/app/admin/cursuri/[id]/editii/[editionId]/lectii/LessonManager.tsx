'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VideoUpload } from '@/components/VideoUpload'

interface Lesson {
  id: string
  editionId: string
  title: string
  order: number
  videoKey: string | null
  zoomLink: string | null
  pdfKeys: string[]
  duration: number | null
  availableFrom: Date | null
  createdAt: Date
}

export function LessonManager({
  lessons: initialLessons,
  editionId,
}: {
  lessons: Lesson[]
  editionId: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [videoKey, setVideoKey] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAvailableFrom, setEditAvailableFrom] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const pdfKeysRaw = (formData.get('pdfKeys') as string) || ''
    const data = {
      editionId,
      title: formData.get('title'),
      order: Number(formData.get('order')),
      videoKey: videoKey || null,
      zoomLink: formData.get('zoomLink') || null,
      pdfKeys: pdfKeysRaw ? pdfKeysRaw.split('\n').map((k) => k.trim()).filter(Boolean) : [],
      duration: formData.get('duration') ? Number(formData.get('duration')) : null,
      availableFrom: formData.get('availableFrom') || null,
    }

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la creare')
      }

      setShowForm(false)
      setVideoKey(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la creare')
    } finally {
      setSaving(false)
    }
  }

  async function handleMove(lessonId: string, newOrder: number) {
    try {
      await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      })
      router.refresh()
    } catch {
      // silent
    }
  }

  async function handleDelete(lessonId: string) {
    if (!confirm('Sigur vrei să ștergi această lecție?')) return
    try {
      await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // silent
    }
  }

  function formatDate(date: Date | null): string {
    if (!date) return '—'
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  function toInputValue(date: Date | null): string {
    if (!date) return ''
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id)
    setEditTitle(lesson.title)
    setEditAvailableFrom(toInputValue(lesson.availableFrom))
    setEditError('')
  }

  async function handleEditSave() {
    if (!editingId || !editTitle.trim()) return
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/admin/lessons/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          availableFrom: editAvailableFrom || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Eroare la salvare')
      }
      setEditingId(null)
      router.refresh()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#51087e] text-white rounded-lg hover:bg-[#51087e]/90 transition-colors text-sm font-medium"
        >
          Adaugă lecție
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titlu
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                  Ordine
                </label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  defaultValue={initialLessons.length + 1}
                  min={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Durată (minute)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <VideoUpload
                  label="Video"
                  value={videoKey}
                  onChange={setVideoKey}
                />
              </div>
              <div>
                <label htmlFor="zoomLink" className="block text-sm font-medium text-gray-700 mb-1">
                  Zoom Link
                </label>
                <input
                  type="url"
                  id="zoomLink"
                  name="zoomLink"
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibil din
                </label>
                <input
                  type="datetime-local"
                  id="availableFrom"
                  name="availableFrom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="pdfKeys" className="block text-sm font-medium text-gray-700 mb-1">
                  PDF Keys (una per linie)
                </label>
                <textarea
                  id="pdfKeys"
                  name="pdfKeys"
                  rows={3}
                  placeholder={"resources/lesson-1/material.pdf\nresources/lesson-1/exercitii.pdf"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#51087e] text-white rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Se creează...' : 'Adaugă'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">Titlu</th>
                <th className="px-6 py-4 font-medium">Durată</th>
                <th className="px-6 py-4 font-medium">Video</th>
                <th className="px-6 py-4 font-medium">Zoom</th>
                <th className="px-6 py-4 font-medium">PDF</th>
                <th className="px-6 py-4 font-medium">Disponibil din</th>
                <th className="px-6 py-4 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {initialLessons.map((lesson, idx) => {
                const isEditing = editingId === lesson.id
                return (
                <tr key={lesson.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 text-gray-500">{lesson.order}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={editSaving}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
                      />
                    ) : (
                      lesson.title
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {lesson.duration ? `${lesson.duration} min` : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {lesson.videoKey ? '✓' : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {lesson.zoomLink ? '✓' : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {lesson.pdfKeys?.length > 0 ? lesson.pdfKeys.length : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        value={editAvailableFrom}
                        onChange={(e) => setEditAvailableFrom(e.target.value)}
                        disabled={editSaving}
                        className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#a007dc] focus:border-transparent"
                      />
                    ) : (
                      formatDate(lesson.availableFrom)
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditSave}
                            disabled={editSaving || !editTitle.trim()}
                            className="text-xs px-2.5 py-1 rounded-md bg-[#a007dc] text-white hover:bg-[#51087e] transition disabled:opacity-50"
                          >
                            {editSaving ? '...' : 'Salvează'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={editSaving}
                            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            Anulează
                          </button>
                        </div>
                        {editError && <span className="text-xs text-red-600">{editError}</span>}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {idx > 0 && (
                          <button
                            onClick={() => handleMove(lesson.id, lesson.order - 1)}
                            className="text-gray-400 hover:text-gray-700 text-xs"
                            title="Mută sus"
                          >
                            ↑
                          </button>
                        )}
                        {idx < initialLessons.length - 1 && (
                          <button
                            onClick={() => handleMove(lesson.id, lesson.order + 1)}
                            className="text-gray-400 hover:text-gray-700 text-xs"
                            title="Mută jos"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(lesson)}
                          className="text-[#a007dc] hover:text-[#51087e] text-xs font-medium ml-2"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
                        >
                          Șterge
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                )
              })}
              {initialLessons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nicio lecție încă.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
