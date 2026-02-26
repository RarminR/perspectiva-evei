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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
        <section className="bg-[#2D1B69] text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">
                Contact
              </span>
            </h1>
            <p className="text-white/80 text-lg">
              Ai o întrebare sau vrei să afli mai multe? Scrie-mi!
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <Section variant="white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-[#2D1B69] mb-6">Trimite un mesaj</h2>
              <ContactForm />
            </div>

            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#2D1B69] mb-6">Informații de contact</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="text-[#E91E8C] text-xl mt-0.5">✉</span>
                  <div>
                    <p className="font-semibold text-[#2D1B69]">Email</p>
                    <a
                      href="mailto:estedespremine@gmail.com"
                      className="text-gray-600 hover:text-[#E91E8C] transition"
                    >
                      estedespremine@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-[#E91E8C] text-xl mt-0.5">⚑</span>
                  <div>
                    <p className="font-semibold text-[#2D1B69]">Firma</p>
                    <p className="text-gray-600">DECOR-IUTA SRL</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-[#FDF2F8] rounded-2xl">
                  <p className="text-[#2D1B69] font-semibold mb-2">Timp de răspuns</p>
                  <p className="text-gray-600 text-sm">
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
