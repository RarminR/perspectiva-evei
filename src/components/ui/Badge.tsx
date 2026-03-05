import React from 'react'

interface BadgeProps {
  variant?: 'pink' | 'purple' | 'green' | 'gray'
  children: React.ReactNode
  className?: string
}

const variants = {
  pink: 'bg-[#a007dc]/10 text-[#a007dc]',
  purple: 'bg-[#51087e]/10 text-[#51087e]',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
}

export function Badge({ variant = 'pink', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
