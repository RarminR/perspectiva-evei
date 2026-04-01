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

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ResolvedProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

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

  async function handlePay() {
    if (!product) return
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

      // Redirect to Revolut's hosted checkout page
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

        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e' }}>
          <strong>Notă:</strong> Prețul este în EUR. Echivalentul în RON poate varia în funcție de cursul valutar la data plății.
        </div>

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
