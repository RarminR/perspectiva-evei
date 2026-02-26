'use client'
import React, { useState } from 'react'
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Badge,
  Accordion,
  Modal,
  ToastProvider,
  useToast,
  Navbar,
  Footer,
  Section,
  Hero,
} from '@/components/ui'

function ToastDemo() {
  const { addToast } = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => addToast('Acesta este un toast informativ', 'info')}>Toast Info</Button>
      <Button size="sm" variant="secondary" onClick={() => addToast('Succes!', 'success')}>Toast Success</Button>
      <Button size="sm" variant="outline" onClick={() => addToast('Eroare!', 'error')}>Toast Error</Button>
      <Button size="sm" variant="ghost" onClick={() => addToast('Avertisment!', 'warning')}>Toast Warning</Button>
    </div>
  )
}

export default function DevComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar />

        <div className="max-w-5xl mx-auto py-12 px-4 space-y-16">
          <h1 className="text-3xl font-bold text-gray-900">
            Componente Design System — Perspectiva Evei
          </h1>

          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Button</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-medium">Variante</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <p className="text-sm text-gray-500 font-medium">Dimensiuni</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <p className="text-sm text-gray-500 font-medium">Stări</p>
              <div className="flex flex-wrap gap-3">
                <Button loading>Se încarcă...</Button>
                <Button disabled>Dezactivat</Button>
              </div>
            </div>
          </section>

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Badge</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="pink">Pink</Badge>
              <Badge variant="purple">Purple</Badge>
              <Badge variant="green">Green</Badge>
              <Badge variant="gray">Gray</Badge>
            </div>
          </section>

          {/* Cards */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Card</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="default">
                <h3 className="font-semibold text-gray-900 mb-2">Card Default</h3>
                <p className="text-gray-600 text-sm">Aceasta este o componentă card de bază.</p>
              </Card>
              <Card variant="pricing">
                <h3 className="font-semibold text-gray-900 mb-2">Card Pricing</h3>
                <p className="text-gray-600 text-sm">Card cu border simplu.</p>
              </Card>
              <Card variant="pricing" featured>
                <Badge variant="pink" className="mb-3">Popular</Badge>
                <h3 className="font-semibold text-gray-900 mb-2">Card Featured</h3>
                <p className="text-gray-600 text-sm">Card cu accent și ring.</p>
              </Card>
            </div>
          </section>

          {/* Input + Textarea + Select */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Input / Textarea / Select</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <Input label="Email" placeholder="exemplu@email.com" helperText="Introduceți emailul dvs." />
              <Input label="Parolă" type="password" error="Parola este obligatorie" />
              <Textarea label="Mesaj" placeholder="Scrieți mesajul..." rows={3} />
              <Select
                label="Plan"
                options={[
                  { value: 'basic', label: 'Basic' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
              />
            </div>
          </section>

          {/* Accordion */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Accordion</h2>
            <div className="max-w-2xl">
              <Accordion
                items={[
                  { question: 'Ce este Cursul A.D.O.?', answer: 'Un program de transformare personală bazat pe principiile de manifestare conștientă.' },
                  { question: 'Cât durează programul?', answer: 'Programul se desfășoară pe parcursul a 8 săptămâni.' },
                  { question: 'Este potrivit pentru începători?', answer: 'Da, cursul este conceput pentru toate nivelurile de experiență.' },
                ]}
              />
            </div>
          </section>

          {/* Modal */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Modal</h2>
            <Button onClick={() => setModalOpen(true)}>Deschide Modal</Button>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirmare">
              <p className="text-gray-600 mb-4">Ești sigur că dorești să continui?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Anulează</Button>
                <Button onClick={() => setModalOpen(false)}>Confirmă</Button>
              </div>
            </Modal>
          </section>

          {/* Toast */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Toast</h2>
            <ToastDemo />
          </section>

          {/* Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Section</h2>
          </section>
        </div>

        <Section variant="dark">
          <h3 className="text-xl font-bold mb-2">Section Dark</h3>
          <p className="text-white/70 text-sm">Secțiune cu fundal violet.</p>
        </Section>
        <Section variant="light-pink">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Section Light Pink</h3>
          <p className="text-gray-600 text-sm">Secțiune cu fundal roz deschis.</p>
        </Section>
        <Section variant="desert">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Section Desert</h3>
          <p className="text-gray-600 text-sm">Secțiune cu fundal deșert.</p>
        </Section>

        {/* Hero */}
        <Hero
          title="Transformă-ți Viața"
          subtitle="Descoperă puterea manifestării conștiente cu Perspectiva Evei."
          ctaText="Începe Acum"
          ctaHref="/cursul-ado"
        />

        {/* Footer */}
        <Footer />
      </div>
    </ToastProvider>
  )
}
