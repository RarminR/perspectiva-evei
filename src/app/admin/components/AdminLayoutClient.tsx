'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutClientProps {
  children: React.ReactNode
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <header className="md:hidden sticky top-0 z-30 bg-[#2D1B69] px-4 py-3 flex items-center gap-3">
          <button
            className="text-white text-xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Deschide meniu"
          >
            ☰
          </button>
          <span className="text-white font-semibold text-sm">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
