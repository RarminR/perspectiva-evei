interface WatermarkProps {
  text: string
}

export function Watermark({ text }: WatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      style={{ userSelect: 'none' }}
    >
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
  )
}
