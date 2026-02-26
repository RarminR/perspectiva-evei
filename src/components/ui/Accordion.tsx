'use client'
import React, { useState } from 'react'

interface AccordionItem {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span>{item.question}</span>
            <span className={`ml-4 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {openIndex === i && (
            <div className="px-6 py-4 text-gray-600 bg-gray-50">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
