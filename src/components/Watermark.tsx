interface WatermarkProps {
  text: string
  /** Absolutely fills the nearest positioned ancestor instead of the sticky
   * top-anchored layout used by scrolling text content. */
  cover?: boolean
}

export function Watermark({ text, cover = false }: WatermarkProps) {
  if (cover) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
        style={{ userSelect: 'none' }}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="absolute w-[140%] -left-[20%] whitespace-nowrap text-base font-semibold tracking-[0.3em] text-gray-700 opacity-10"
            style={{
              top: `${5 + index * 13}%`,
              transform: 'rotate(-30deg)',
            }}
          >
            {text} {text} {text}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none sticky top-0 z-10 h-0 w-full overflow-visible select-none"
      style={{ userSelect: 'none' }}
    >
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '100vh' }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="absolute w-[120%] -left-[10%] whitespace-nowrap text-sm font-medium tracking-[0.5em] text-gray-500 opacity-10"
            style={{
              top: `${index * 14}%`,
              transform: 'rotate(-30deg)',
            }}
          >
            {text} {text} {text}
          </div>
        ))}
      </div>
    </div>
  )
}
