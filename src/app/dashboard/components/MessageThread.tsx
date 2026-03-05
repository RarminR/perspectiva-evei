'use client'
import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  fromAdmin: boolean
  content: string
  read: boolean
  createdAt: string
}

export function MessageThread() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (res.ok) {
        const newMsg = await res.json()
        setMessages((prev) => [...prev, newMsg])
      }
    } catch {
      // restore input on failure
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()

    const time = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return time
    return `${d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })} ${time}`
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
        Se încarcă...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '0.9rem',
          }}>
            Nicio conversație încă. Trimite un mesaj către Eva!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.fromAdmin ? 'flex-start' : 'flex-end',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '0.65rem 1rem',
                  borderRadius: msg.fromAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  backgroundColor: msg.fromAdmin ? 'rgba(81,8,126,0.08)' : '#51087e',
                  color: msg.fromAdmin ? '#2c0246' : '#ffffff',
                }}
              >
                {msg.fromAdmin && (
                  <p style={{
                    margin: '0 0 2px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#a007dc',
                  }}>
                    Eva
                  </p>
                )}
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '0.7rem',
                  color: msg.fromAdmin ? '#999' : 'rgba(255,255,255,0.6)',
                  textAlign: 'right',
                }}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid rgba(81,8,126,0.1)',
        padding: '0.75rem 1rem',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Scrie un mesaj..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid rgba(81,8,126,0.2)',
            outline: 'none',
            fontSize: '0.9rem',
            backgroundColor: 'rgba(81,8,126,0.03)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: !input.trim() || sending ? '#ccc' : '#51087e',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {sending ? '...' : 'Trimite'}
        </button>
      </div>
    </div>
  )
}
