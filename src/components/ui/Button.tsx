import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'alt' | 'outline' | 'outline-light' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: '#51087e',
    border: '1px solid #51087e',
    color: '#f8f9fa',
  },
  alt: {
    backgroundColor: 'white',
    border: '1px solid white',
    color: '#51087e',
  },
  outline: {
    backgroundColor: 'transparent',
    border: '1px solid #51087e',
    color: '#51087e',
  },
  'outline-light': {
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
  },
  secondary: {
    backgroundColor: '#51087e',
    border: '1px solid #51087e',
    color: '#f8f9fa',
  },
  ghost: {
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: '#a007dc',
  },
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant] || variantStyles.primary

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      style={{
        borderRadius: '999px',
        ...variantStyle,
        ...style,
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="mr-2 inline-block animate-spin">⟳</span>
      ) : null}
      {children}
    </button>
  )
}
