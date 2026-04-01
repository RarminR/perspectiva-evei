'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type ResolvedProduct = {
  productId: string
  productType: string
  name: string
  priceEur: number
  priceEurCents: number
  paymentType?: string
}

type CheckoutApiResponse = {
  orderId: string
  revolutOrderId: string
  checkoutToken: string
  checkoutUrl: string
  bypassed?: boolean
}

const JUDETE = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin', 'Cluj',
  'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj',
  'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți',
  'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava',
  'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
]

const SECTOARE = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6']

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '12px',
  fontSize: '0.95rem',
  outline: 'none',
  backgroundColor: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#51087e',
  marginBottom: '0.35rem',
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ResolvedProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  // Address form
  const [nume, setNume] = useState('')
  const [prenume, setPrenume] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [judet, setJudet] = useState('')
  const [sector, setSector] = useState('')
  const [oras, setOras] = useState('')
  const [adresa, setAdresa] = useState('')
  const [codPostal, setCodPostal] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const isBucuresti = judet === 'București'

  const rawProductType = searchParams.get('product') || searchParams.get('productType')
  const rawId = searchParams.get('id') || searchParams.get('productId')
  const paymentType = searchParams.get('type') || searchParams.get('paymentType') || 'full'

  useEffect(() => {
    let mounted = true

    async function resolve() {
      if (!rawProductType) {
        setError('Tipul produsului lipsește.')
        setLoading(false)
        return
      }

      const params = new URLSearchParams({ productType: rawProductType })
      if (rawId) params.set('id', rawId)
      params.set('paymentType', paymentType)

      const res = await fetch(`/api/checkout/resolve?${params}`)
      if (!res.ok) {
        const data = await res.json()
        if (mounted) {
          setError(data.error || 'Produsul nu a putut fi găsit.')
          setLoading(false)
        }
        return
      }

      const resolved = (await res.json()) as ResolvedProduct
      if (mounted) {
        setProduct(resolved)
        setLoading(false)
      }
    }

    void resolve()
    return () => { mounted = false }
  }, [rawProductType, rawId, paymentType])

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!nume.trim()) errors.nume = 'Numele este obligatoriu'
    if (!prenume.trim()) errors.prenume = 'Prenumele este obligatoriu'
    if (!email.trim()) errors.email = 'Email-ul este obligatoriu'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email invalid'
    if (!telefon.trim()) errors.telefon = 'Telefonul este obligatoriu'
    if (!judet) errors.judet = 'Județul este obligatoriu'
    if (isBucuresti && !sector) errors.sector = 'Sectorul este obligatoriu'
    if (!isBucuresti && !oras.trim()) errors.oras = 'Orașul este obligatoriu'
    if (!adresa.trim()) errors.adresa = 'Adresa este obligatorie'
    if (!codPostal.trim()) errors.codPostal = 'Codul poștal este obligatoriu'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handlePay() {
    if (!product) return
    if (!validateForm()) return

    setRedirecting(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            productId: product.productId,
            productType: product.productType,
            name: product.name,
            priceEurCents: product.priceEurCents,
            quantity: 1,
          }],
          billing: {
            firstName: prenume.trim(),
            lastName: nume.trim(),
            email: email.trim(),
            phone: telefon.trim(),
            country: 'România',
            county: judet,
            sector: isBucuresti ? sector : undefined,
            city: isBucuresti ? sector : oras.trim(),
            address: adresa.trim(),
            postalCode: codPostal.trim(),
          },
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Nu am putut inițializa checkout-ul.')
      }

      const payload = (await response.json()) as CheckoutApiResponse

      if (payload.bypassed) {
        router.push(`/checkout/success?orderId=${payload.orderId}`)
        return
      }

      window.location.href = payload.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la checkout.')
      setRedirecting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)' }}>
        <p style={{ color: '#51087e', fontSize: '1.1rem' }}>Se încarcă...</p>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</p>
          <a href="/" style={{ color: '#a007dc', fontWeight: 600 }}>Înapoi acasă</a>
        </div>
      </div>
    )
  }

  if (!product) return null

  const displayPrice = product.priceEur.toFixed(2)

  return (
    <div style={{ minHeight: '100vh', backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)', padding: '60px 5%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#a007dc',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Înapoi
        </button>

        <h1 style={{
          backgroundImage: 'linear-gradient(90deg, #51087e, #8f0edf)',
          WebkitTextFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          fontSize: '1.8rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
        }}>
          Finalizare comandă
        </h1>

        {/* Order summary */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(81,8,126,0.1)' }}>
          <h2 style={{ color: '#51087e', fontWeight: 700, marginBottom: '1rem' }}>Rezumat comandă</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#444' }}>{product.name}</span>
            <span style={{ fontWeight: 700, color: '#51087e', fontSize: '1.1rem' }}>EUR {displayPrice}</span>
          </div>
          {product.paymentType === 'installment' && (
            <p style={{ color: '#92400e', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Prima rată · a doua rată va fi facturată ulterior
            </p>
          )}
        </div>

        {/* Billing address form */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(81,8,126,0.1)' }}>
          <h2 style={{ color: '#51087e', fontWeight: 700, marginBottom: '1.25rem' }}>Adresa de facturare</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Nume */}
            <div>
              <label style={labelStyle}>Nume *</label>
              <input
                type="text"
                value={nume}
                onChange={(e) => setNume(e.target.value)}
                style={{ ...inputStyle, borderColor: formErrors.nume ? '#dc2626' : '#d1d5db' }}
                placeholder="Popescu"
              />
              {formErrors.nume && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.nume}</p>}
            </div>

            {/* Prenume */}
            <div>
              <label style={labelStyle}>Prenume *</label>
              <input
                type="text"
                value={prenume}
                onChange={(e) => setPrenume(e.target.value)}
                style={{ ...inputStyle, borderColor: formErrors.prenume ? '#dc2626' : '#d1d5db' }}
                placeholder="Maria"
              />
              {formErrors.prenume && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.prenume}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Email */}
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, borderColor: formErrors.email ? '#dc2626' : '#d1d5db' }}
                placeholder="email@exemplu.ro"
              />
              {formErrors.email && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.email}</p>}
            </div>

            {/* Telefon */}
            <div>
              <label style={labelStyle}>Telefon *</label>
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                style={{ ...inputStyle, borderColor: formErrors.telefon ? '#dc2626' : '#d1d5db' }}
                placeholder="07xx xxx xxx"
              />
              {formErrors.telefon && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.telefon}</p>}
            </div>
          </div>

          {/* Țara */}
          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}>Țara</label>
            <input
              type="text"
              value="România"
              disabled
              style={{ ...inputStyle, backgroundColor: '#f3f4f6', color: '#6b7280' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isBucuresti ? '1fr 1fr' : '1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Județ */}
            <div>
              <label style={labelStyle}>Județ *</label>
              <select
                value={judet}
                onChange={(e) => {
                  setJudet(e.target.value)
                  setSector('')
                  setOras('')
                }}
                style={{ ...inputStyle, borderColor: formErrors.judet ? '#dc2626' : '#d1d5db', cursor: 'pointer' }}
              >
                <option value="">Selectează județul</option>
                {JUDETE.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              {formErrors.judet && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.judet}</p>}
            </div>

            {/* Sector (doar pt București) */}
            {isBucuresti && (
              <div>
                <label style={labelStyle}>Sector *</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{ ...inputStyle, borderColor: formErrors.sector ? '#dc2626' : '#d1d5db', cursor: 'pointer' }}
                >
                  <option value="">Selectează sectorul</option>
                  {SECTOARE.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {formErrors.sector && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.sector}</p>}
              </div>
            )}
          </div>

          {/* Oraș (doar dacă nu e București) */}
          {!isBucuresti && (
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Oraș *</label>
              <input
                type="text"
                value={oras}
                onChange={(e) => setOras(e.target.value)}
                style={{ ...inputStyle, borderColor: formErrors.oras ? '#dc2626' : '#d1d5db' }}
                placeholder="Numele orașului"
              />
              {formErrors.oras && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.oras}</p>}
            </div>
          )}

          {/* Adresă */}
          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}>Adresă *</label>
            <input
              type="text"
              value={adresa}
              onChange={(e) => setAdresa(e.target.value)}
              style={{ ...inputStyle, borderColor: formErrors.adresa ? '#dc2626' : '#d1d5db' }}
              placeholder="Strada, număr, bloc, scară, apt."
            />
            {formErrors.adresa && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.adresa}</p>}
          </div>

          {/* Cod poștal */}
          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}>Cod poștal *</label>
            <input
              type="text"
              value={codPostal}
              onChange={(e) => setCodPostal(e.target.value)}
              style={{ ...inputStyle, borderColor: formErrors.codPostal ? '#dc2626' : '#d1d5db', maxWidth: '200px' }}
              placeholder="000000"
            />
            {formErrors.codPostal && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.codPostal}</p>}
          </div>
        </div>

        {/* Note */}
        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e' }}>
          <strong>Notă:</strong> Prețul este în EUR. Echivalentul în RON poate varia în funcție de cursul valutar la data plății.
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={redirecting}
          style={{
            width: '100%',
            backgroundColor: '#a007dc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: redirecting ? 'wait' : 'pointer',
            opacity: redirecting ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {redirecting ? 'Se redirecționează...' : `Plătește EUR ${displayPrice}`}
        </button>

        {error && (
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#dc2626', textAlign: 'center' }}>{error}</p>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Se încarcă...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
