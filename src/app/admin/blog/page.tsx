import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="px-4 py-2 bg-[#a007dc] text-white rounded-lg text-sm font-medium hover:bg-[#d4177e] transition"
        >
          Adaugă articol
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {posts.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Niciun articol încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4 font-medium">Titlu</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Publicat la</th>
                  <th className="p-4 font-medium">Creat</th>
                  <th className="p-4 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{post.title}</td>
                    <td className="p-4 text-gray-500">{post.slug}</td>
                    <td className="p-4">
                      {post.published ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          Publicat
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">
                      {post.publishedAt ? formatDate(post.publishedAt) : '—'}
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(post.createdAt)}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-[#a007dc] hover:underline font-medium"
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
