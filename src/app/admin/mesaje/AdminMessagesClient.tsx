'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Conversation {
  userId: string
  name: string
  email: string
  lastMessage: {
    content: string
    fromAdmin: boolean
    createdAt: string
    read: boolean
  } | null
  unreadCount: number
}

interface Message {
  id: string
  fromAdmin: boolean
  content: string
  read: boolean
  createdAt: string
}

interface AdminMessagesClientProps {
  conversations: Conversation[]
}

export function AdminMessagesClient({ conversations }: AdminMessagesClientProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedUser = conversations.find((c) => c.userId === selected)

  const loadMessages = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/messages/${userId}`)
      if (res.ok) setMessages(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selected) loadMessages(selected)
  }, [selected, loadMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!selected || !input.trim() || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selected, content: input.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
        setInput('')
      }
    } catch {}
    setSending(false)
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return `${d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })} ${time}`
  }

  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-500">
            {conversations.length} conversații
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => setSelected(conv.userId)}
              className="w-full text-left"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: selected === conv.userId ? 'rgba(81,8,126,0.06)' : 'transparent',
                cursor: 'pointer',
                border: 'none',
                borderBlockEnd: '1px solid #f3f4f6',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{conv.name}</span>
                {conv.unreadCount > 0 && (
                  <span
                    className="text-xs font-bold text-white rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: '#a007dc',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.7rem',
                    }}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{conv.email}</p>
              {conv.lastMessage && (
                <p className="text-xs text-gray-400 truncate mt-1">
                  {conv.lastMessage.fromAdmin ? 'Tu: ' : ''}
                  {conv.lastMessage.content}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selectează o conversație
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{selectedUser?.name}</p>
              <p className="text-xs text-gray-500">{selectedUser?.email}</p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Se încarcă...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Niciun mesaj
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.fromAdmin ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '0.6rem 1rem',
                        borderRadius: msg.fromAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        backgroundColor: msg.fromAdmin ? '#51087e' : '#f3f4f6',
                        color: msg.fromAdmin ? '#ffffff' : '#1f2937',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: '0.65rem',
                        color: msg.fromAdmin ? 'rgba(255,255,255,0.6)' : '#9ca3af',
                        textAlign: 'right',
                      }}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Scrie un răspuns..."
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#a007dc]"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="px-4 py-2 bg-[#51087e] text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {sending ? '...' : 'Trimite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
