import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ProductCheckoutForm } from './components/ProductCheckoutForm'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product || !product.active) {
    return <div className="p-8 text-center">Produsul nu a fost găsit.</div>
  }

  const session = await auth()
  const userId = session?.user ? (session.user as any).id : null

  return (
    <div className="min-h-screen bg-[#f5f0ff]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-white shadow-sm">
                <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-square bg-white rounded-2xl flex items-center justify-center text-gray-300 text-6xl shadow-sm">
                🛍️
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {product.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square relative rounded-lg overflow-hidden bg-white">
                    <Image src={img} alt={`${product.title} ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info + checkout */}
          <div>
            <h1 className="text-3xl font-bold text-[#51087e] mb-3">{product.title}</h1>
            <p className="text-2xl font-bold text-[#a007dc] mb-4">€{product.price.toFixed(2)}</p>
            {product.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
            )}
            {product.stock > 0 ? (
              <p className="text-green-600 text-sm mb-6">✓ În stoc ({product.stock} disponibile)</p>
            ) : (
              <p className="text-red-500 text-sm mb-6">Stoc epuizat</p>
            )}

            {product.stock > 0 && (
              <ProductCheckoutForm
                productId={product.id}
                productTitle={product.title}
                price={product.price}
                userId={userId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
