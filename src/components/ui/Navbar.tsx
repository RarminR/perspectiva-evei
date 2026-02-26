'use client'
import React, { useState } from 'react'
import Link from 'next/link'

interface NavbarProps {
  user?: { name: string; email: string } | null
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 bg-[#2D1B69]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">
            Perspectiva Evei
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/80 hover:text-white text-sm transition">Acasă</Link>
            <Link href="/cursul-ado" className="text-white/80 hover:text-white text-sm transition">Cursul A.D.O.</Link>
            <Link href="/ghiduri" className="text-white/80 hover:text-white text-sm transition">Ghiduri</Link>
            <Link href="/sedinte-1-la-1" className="text-white/80 hover:text-white text-sm transition">Ședințe 1:1</Link>
            <Link href="/blog" className="text-white/80 hover:text-white text-sm transition">Blog</Link>
            {user ? (
              <span className="text-white text-sm font-medium">{user.name}</span>
            ) : (
              <Link href="/logare" className="bg-[#E91E8C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E91E8C]/90 transition">
                Intră în cont
              </Link>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Meniu">☰</button>
        </div>
        {mobileOpen && (
          <div className="md:hidden py-4 flex flex-col gap-3 border-t border-white/10">
            <Link href="/" className="text-white/80 hover:text-white text-sm">Acasă</Link>
            <Link href="/cursul-ado" className="text-white/80 hover:text-white text-sm">Cursul A.D.O.</Link>
            <Link href="/ghiduri" className="text-white/80 hover:text-white text-sm">Ghiduri</Link>
            <Link href="/sedinte-1-la-1" className="text-white/80 hover:text-white text-sm">Ședințe 1:1</Link>
            <Link href="/blog" className="text-white/80 hover:text-white text-sm">Blog</Link>
            {!user && <Link href="/logare" className="bg-[#E91E8C] text-white px-4 py-2 rounded-lg text-sm font-semibold w-fit">Intră în cont</Link>}
          </div>
        )}
      </div>
    </nav>
  )
}
