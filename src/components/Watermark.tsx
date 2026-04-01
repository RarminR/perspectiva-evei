interface WatermarkProps {
  text: string
}

export function Watermark({ text }: WatermarkProps) {
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
