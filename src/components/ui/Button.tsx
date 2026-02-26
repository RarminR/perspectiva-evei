import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary: 'bg-[#E91E8C] text-white hover:bg-[#E91E8C]/90',
  secondary: 'bg-[#2D1B69] text-white hover:bg-[#2D1B69]/90',
  outline: 'border-2 border-[#E91E8C] text-[#E91E8C] hover:bg-[#E91E8C] hover:text-white',
  ghost: 'text-[#E91E8C] hover:bg-[#E91E8C]/10',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#E91E8C]/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="mr-2 animate-spin">⟳</span> : null}
      {children}
    </button>
  )
}
