'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: string
  duration?: number
}

export function CountUp({ value, duration = 2000 }: CountUpProps) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          animate()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function animate() {
    const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10)
    const suffix = value.replace(/[0-9]/g, '')
    const start = performance.now()

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * numeric)

      setDisplay(current + suffix)

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }

  return <span ref={ref}>{display}</span>
}
