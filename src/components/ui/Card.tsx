import React from 'react'

interface CardProps {
  variant?: 'default' | 'pricing' | 'testimonial'
  children: React.ReactNode
  className?: string
  featured?: boolean
}

export function Card({ variant = 'default', children, className = '', featured }: CardProps) {
  const base = 'rounded-2xl shadow-lg overflow-hidden'
  const variants = {
    default: 'bg-white p-6',
    pricing: `bg-white p-8 ${featured ? 'border-2 border-[#E91E8C] ring-4 ring-[#E91E8C]/20' : 'border border-gray-200'}`,
    testimonial: 'bg-white p-6 border border-gray-100',
  }
  return <div className={`${base} ${variants[variant]} ${className}`}>{children}</div>
}
