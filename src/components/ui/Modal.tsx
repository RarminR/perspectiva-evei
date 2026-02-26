'use client'
import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Închide">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
