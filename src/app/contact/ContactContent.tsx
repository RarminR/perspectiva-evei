'use client'

import { useState } from 'react'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast('Toate câmpurile sunt obligatorii.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        addToast(data.error || 'A apărut o eroare. Încearcă din nou.', 'error')
        return
      }

      addToast('Mesajul tău a fost trimis cu succes!', 'success')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      addToast('A apărut o eroare de rețea. Încearcă din nou.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
      <Input
        label="Nume"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Numele tău complet"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="adresa@email.com"
        required
      />
      <Textarea
        label="Mesaj"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Scrie mesajul tău aici..."
        rows={5}
        required
      />
      <Button type="submit" loading={loading} size="lg" className="w-full">
        Trimite mesajul
      </Button>
    </form>
  )
}

export default function ContactContent() {
  return (
    <ToastProvider>
      <main>
        <Navbar />

        {/* Hero */}
        <section style={{
          backgroundImage: 'linear-gradient(#51087e, #a62bf1)',
          padding: '100px 5%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '940px', width: '100%' }}>
            <h1 style={{
              backgroundImage: 'linear-gradient(90deg, white, #e0e0e0)',
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              Contact
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
              Ai o întrebare sau vrei să afli mai multe? Scrie-mi!
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <Section variant="default">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
            {/* Form */}
            <div>
              <h2 style={{
                backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
              }}>
                Trimite un mesaj
              </h2>
              <ContactForm />
            </div>

            {/* Info */}
            <div>
              <h2 style={{
                backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
              }}>
                Informații de contact
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'white', color: '#51087e', borderRadius: '12px', width: '48px', height: '48px', boxShadow: '0 0 15px rgba(81,8,126,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                    ✉
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#51087e', marginBottom: '0.25rem' }}>Email</p>
                    <a href="mailto:estedespremine@gmail.com" style={{ color: '#666', textDecoration: 'none' }}>
                      estedespremine@gmail.com
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'white', color: '#51087e', borderRadius: '12px', width: '48px', height: '48px', boxShadow: '0 0 15px rgba(81,8,126,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                    ⚑
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#51087e', marginBottom: '0.25rem' }}>Firma</p>
                    <p style={{ color: '#666' }}>DECOR-IUTA SRL</p>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(81,8,126,0.1)', borderRadius: '20px', padding: '1.5rem', marginTop: '0.5rem' }}>
                  <p style={{ color: '#51087e', fontWeight: 700, marginBottom: '0.5rem' }}>Timp de răspuns</p>
                  <p style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    De obicei răspund în maximum 24 de ore. Pentru urgențe,
                    te rog să menționezi în subiect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Footer />
      </main>
    </ToastProvider>
  )
}
