'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  productTitle: string
  price: number
  userId: string | null
}

export function ProductCheckoutForm({ productId, productTitle, price, userId }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    judet: '',
    localitate: '',
    strada: '',
    codPostal: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      router.push('/logare')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout/physical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, shippingAddress: shipping }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eroare la procesarea comenzii')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cantitate</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            −
          </button>
          <span className="font-medium text-lg w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Shipping address */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-[#2D1B69] mb-3">Adresă de livrare</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prenume *</label>
            <input
              required
              value={shipping.firstName}
              onChange={(e) => setShipping((s) => ({ ...s, firstName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nume *</label>
            <input
              required
              value={shipping.lastName}
              onChange={(e) => setShipping((s) => ({ ...s, lastName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telefon *</label>
            <input
              required
              type="tel"
              value={shipping.phone}
              onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Județ *</label>
            <input
              required
              value={shipping.judet}
              onChange={(e) => setShipping((s) => ({ ...s, judet: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Localitate *</label>
            <input
              required
              value={shipping.localitate}
              onChange={(e) => setShipping((s) => ({ ...s, localitate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cod poștal *</label>
            <input
              required
              value={shipping.codPostal}
              onChange={(e) => setShipping((s) => ({ ...s, codPostal: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Stradă și număr *</label>
            <input
              required
              value={shipping.strada}
              onChange={(e) => setShipping((s) => ({ ...s, strada: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="border-t pt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span>
            Total ({quantity}x {productTitle})
          </span>
          <span className="font-bold text-[#2D1B69]">€{(price * quantity).toFixed(2)}</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E91E8C] text-white py-3 rounded-full font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Se procesează...' : 'Continuă spre plată'}
        </button>
      </div>
    </form>
  )
}
