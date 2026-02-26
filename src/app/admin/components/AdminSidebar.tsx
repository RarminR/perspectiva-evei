'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/cursuri', label: 'Cursuri', icon: '🎓' },
  { href: '/admin/ghiduri', label: 'Ghiduri', icon: '📚' },
  { href: '/admin/produse', label: 'Produse', icon: '🛍️' },
  { href: '/admin/utilizatori', label: 'Utilizatori', icon: '👥' },
  { href: '/admin/comenzi', label: 'Comenzi', icon: '📦' },
  { href: '/admin/facturi', label: 'Facturi', icon: '🧾' },
  { href: '/admin/blog', label: 'Blog', icon: '✍️' },
  { href: '/admin/studii-de-caz', label: 'Studii de caz', icon: '💼' },
  { href: '/admin/promo-coduri', label: 'Promo coduri', icon: '🏷️' },
  { href: '/admin/programari', label: 'Programări', icon: '📅' },
  { href: '/admin/setari', label: 'Setări', icon: '⚙️' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#2D1B69] min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-white font-bold text-lg">Admin Panel</h1>
        <p className="text-white/50 text-xs mt-1">Perspectiva Evei</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#E91E8C] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
