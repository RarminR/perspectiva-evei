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
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Finalizare comandă</h1>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 font-semibold text-gray-700">Rezumat comandă</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{productName}</span>
            <span className="font-bold text-gray-900">EUR {displayPrice}</span>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Notă:</strong> Prețul este în EUR. Echivalentul în RON poate varia în funcție de cursul valutar
          la data plății.
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <div id="revolut-checkout" className="flex min-h-[200px] items-center justify-center text-gray-400">
            Se încarcă metoda de plată...
          </div>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Se încarcă...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
