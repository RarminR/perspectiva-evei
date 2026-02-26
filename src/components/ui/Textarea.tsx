import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({ label, error, helperText, id, className = '', ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#E91E8C]'} focus:outline-none focus:ring-2 transition resize-y min-h-[100px] ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
