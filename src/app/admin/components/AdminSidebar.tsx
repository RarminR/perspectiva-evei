'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/cursuri', label: 'Cursuri', icon: '🎓' },
  { href: '/admin/ghiduri', label: 'Ghiduri', icon: '📚' },
  { href: '/admin/produse', label: 'Produse', icon: '🛍️' },
  { href: '/admin/bundle-uri', label: 'Bundle-uri', icon: '📦' },
  { href: '/admin/clienti', label: 'Clienți (CRM)', icon: '📋' },
  { href: '/admin/utilizatori', label: 'Utilizatori', icon: '👥' },
  { href: '/admin/comenzi', label: 'Comenzi', icon: '📦' },
  { href: '/admin/facturi', label: 'Facturi', icon: '🧾' },
  { href: '/admin/promo-coduri', label: 'Promo coduri', icon: '🏷️' },
  { href: '/admin/programari', label: 'Programări', icon: '📅' },
  { href: '/admin/disponibilitate', label: 'Disponibilitate', icon: '🕐' },
  { href: '/admin/activitate', label: 'Activitate', icon: '🛡️' },
  { href: '/admin/setari', label: 'Setări', icon: '⚙️' },
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{ backgroundImage: 'linear-gradient(180deg, #51087e, #2c0246)' }}
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:transform-none`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">Admin Panel</h1>
            <p className="text-white/50 text-xs mt-1">Perspectiva Evei</p>
          </div>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={onClose}
            aria-label="Închide meniu"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-[#a007dc] text-white'
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
    </>
  )
}
