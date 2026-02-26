import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  imageSrc?: string
}

export function Hero({ title, subtitle, ctaText, ctaHref = '/', imageSrc }: HeroProps) {
  return (
    <div className="bg-[#2D1B69] text-white py-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-white/80 text-lg mb-8">{subtitle}</p>}
          {ctaText && (
            <Link href={ctaHref} className="inline-block bg-[#E91E8C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E91E8C]/90 transition">
              {ctaText}
            </Link>
          )}
        </div>
        {imageSrc && (
          <div className="flex justify-center">
            <Image src={imageSrc} alt="" width={600} height={400} className="rounded-2xl shadow-2xl max-h-96 object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}
