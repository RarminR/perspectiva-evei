'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  fontSize: '1rem',
  marginTop: '0.35rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  color: '#2c0246',
  marginBottom: '1rem',
}

export function WithdrawalForm() {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contract, setContract] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ when: string; ackSent: boolean } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setName((current) => current || session.user?.name || '')
      setEmail((current) => current || session.user?.email || '')
    }
  }, [session])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/retragere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, contract, orderDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nu am putut trimite declarația.')
      setDone({ when: data.when, ackSent: data.ackSent })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut trimite declarația.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div
        role="status"
        style={{ background: '#f6edfc', borderRadius: '12px', padding: '1.5rem', color: '#2c0246' }}
      >
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Am primit declarația ta de retragere.</p>
        <p style={{ margin: 0 }}>
          Primită pe {done.when} (ora României).{' '}
          {done.ackSent
            ? `Ți-am trimis confirmarea, cu conținutul declarației, pe ${email}.`
            : 'Nu am reușit să trimitem confirmarea pe e-mail; păstrează această pagină sau scrie-ne la estedespremine@gmail.com.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate={false}>
      <label style={labelStyle}>
        Nume și prenume
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
        />
      </label>
      <label style={labelStyle}>
        E-mail (aici primești confirmarea)
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={200}
          autoComplete="email"
        />
      </label>
      <label style={labelStyle}>
        Contractul din care te retragi
        <input
          style={inputStyle}
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          required
          maxLength={300}
          placeholder="Nr. comenzii sau produsul, de ex. Cursul A.D.O.! – Ediția 15"
        />
      </label>
      <label style={labelStyle}>
        Data comenzii (opțional)
        <input
          style={inputStyle}
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={sending}
        style={{
          width: '100%',
          backgroundColor: '#51087e',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          padding: '1rem 2rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          cursor: sending ? 'wait' : 'pointer',
          opacity: sending ? 0.7 : 1,
        }}
      >
        {sending ? 'Se trimite...' : 'Confirmă retragerea aici'}
      </button>

      {error && (
        <p role="alert" style={{ marginTop: '1rem', color: '#dc2626', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </form>
  )
}
