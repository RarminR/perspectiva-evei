import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function formatPrice(price: number): string {
  return `€${price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Produse</h1>
        <Link
          href="/admin/produse/new"
          className="px-4 py-2 bg-[#E91E8C] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          Adaugă produs
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {products.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun produs încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Titlu</th>
                  <th className="p-4 font-medium">Preț</th>
                  <th className="p-4 font-medium">Stoc</th>
                  <th className="p-4 font-medium">Activ</th>
                  <th className="p-4 font-medium">Creat</th>
                  <th className="p-4 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{product.title}</td>
                    <td className="p-4 text-gray-900">{formatPrice(product.price)}</td>
                    <td className="p-4 text-gray-900">{product.stock}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.active ? 'Da' : 'Nu'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(product.createdAt)}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/produse/${product.id}`}
                        className="text-[#E91E8C] hover:underline font-medium"
                      >
                        Editează
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
