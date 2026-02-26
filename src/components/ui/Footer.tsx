import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#2D1B69] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent mb-2">
              Perspectiva Evei
            </h3>
            <p className="text-white/60 text-sm">Transformare prin conștiință și manifestare.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/90">Servicii</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/cursul-ado" className="hover:text-white transition">Cursul A.D.O.</Link></li>
              <li><Link href="/ghiduri" className="hover:text-white transition">Ghiduri</Link></li>
              <li><Link href="/sedinte-1-la-1" className="hover:text-white transition">Ședințe 1:1</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/90">Contact</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/contact" className="hover:text-white transition">Contactează-ne</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © 2025 Perspectiva Evei. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  )
}
