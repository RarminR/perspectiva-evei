import React from 'react'

interface SectionProps {
  variant?: 'default' | 'alt' | 'dark' | 'hero' | 'white' | 'light-pink' | 'desert' | 'cta'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alt: {
    backgroundImage: 'linear-gradient(180deg, #e8c2ff, white)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  white: {
    backgroundColor: 'white',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  'light-pink': {
    backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dark: {
    backgroundImage: 'linear-gradient(180deg, #51087e, #2c0246)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
  },
  hero: {
    backgroundImage: 'linear-gradient(#51087e, #a62bf1)',
    padding: '120px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
  },
  desert: {
    backgroundImage: 'linear-gradient(180deg, #e8c2ff, white)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cta: {
    backgroundImage: 'linear-gradient(180deg, #51087e, #2c0246)',
    padding: '90px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
  },
}

export function Section({ variant = 'default', children, className = '', style }: SectionProps) {
  const baseStyle = variantStyles[variant] || variantStyles.default
  return (
    <section style={{ ...baseStyle, ...style }} className={className}>
      <div style={{ maxWidth: '940px', width: '100%', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}
