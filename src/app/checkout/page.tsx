'use client'

import RevolutCheckout from '@revolut/checkout'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

type CheckoutApiResponse = {
  orderId: string
  revolutOrderId: string
  checkoutToken: string
  checkoutUrl: string
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productName = searchParams.get('product') || 'Produs'
  const productId = searchParams.get('productId') || 'single-product'
  const productType = searchParams.get('productType') || 'PRODUCT'
  const rawPrice = searchParams.get('price') || '0'
  const parsedPrice = Number(rawPrice)
  const displayPrice = Number.isFinite(parsedPrice) ? parsedPrice.toFixed(2) : '0.00'
  const [error, setError] = useState<string | null>(null)

  const amountCents = useMemo(() => {
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return 0
    }
    return Math.round(parsedPrice * 100)
  }, [parsedPrice])

  useEffect(() => {
    let mounted = true

    async function initCheckout() {
      if (amountCents <= 0) {
        setError('Preț invalid pentru checkout.')
        return
      }

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [
              {
                productId,
                productType,
                name: productName,
                priceEurCents: amountCents,
                quantity: 1,
              },
            ],
          }),
        })

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || 'Nu am putut inițializa checkout-ul.')
        }

        const payload = (await response.json()) as CheckoutApiResponse
        if (!mounted) {
          return
        }

        const mode = process.env.NEXT_PUBLIC_REVOLUT_MODE === 'production' ? 'prod' : 'sandbox'
        const checkout = await RevolutCheckout(payload.checkoutToken, mode)
        const targetEl = document.getElementById('revolut-checkout')
        if (!targetEl) {
          throw new Error('Containerul checkout nu este disponibil.')
        }
        const target: HTMLElement = targetEl

        checkout.revolutPay({
          target,
          locale: 'ro',
          buttonStyle: {
            size: 'large',
            radius: 'large',
            variant: 'dark',
            action: 'pay',
            height: '48px',
          },
          onSuccess: () => {
            router.push(`/checkout/success?orderId=${payload.orderId}`)
          },
          onError: () => {
            setError('Plata a eșuat. Te rugăm să încerci din nou.')
          },
          onCancel: () => {
            setError('Plata a fost anulată.')
          },
        })
      } catch (checkoutError) {
        if (mounted) {
          setError(checkoutError instanceof Error ? checkoutError.message : 'Eroare la checkout.')
        }
      }
    }

    void initCheckout()

    return () => {
      mounted = false
    }
  }, [amountCents, productId, productName, productType, router])

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
          Finalizare comanda
        </h1>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(81,8,126,0.1)' }}>
          <h2 style={{ color: '#51087e', fontWeight: 700, marginBottom: '1rem' }}>Rezumat comanda</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#444' }}>{productName}</span>
            <span style={{ fontWeight: 700, color: '#51087e', fontSize: '1.1rem' }}>EUR {displayPrice}</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e' }}>
          <strong>Nota:</strong> Pretul este in EUR. Echivalentul in RON poate varia in functie de cursul valutar la data platii.
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(81,8,126,0.1)' }}>
          <div id="revolut-checkout" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Se incarca metoda de plata...
          </div>
          {error ? <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#dc2626' }}>{error}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Se incarca...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
