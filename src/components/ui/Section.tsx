import React from 'react'

interface SectionProps {
  variant?: 'dark' | 'light-pink' | 'desert' | 'white'
  children: React.ReactNode
  className?: string
}

const variants = {
  dark: 'bg-[#2D1B69] text-white',
  'light-pink': 'bg-[#FDF2F8]',
  desert: 'bg-[#C4956A]/20',
  white: 'bg-white',
}

export function Section({ variant = 'white', children, className = '' }: SectionProps) {
  return (
    <section className={`py-16 px-4 ${variants[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  )
}
