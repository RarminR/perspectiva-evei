'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LessonCardProps {
  index: number
  lessonId: string
  editionSlug: string
  title: string
  duration: number | null
  availableFrom: string | null
  zoomLink: string | null
  videoKey: string | null
  pdfKeys?: string[]
  isWatched: boolean
}

type LessonState = 'locked' | 'join' | 'pending' | 'recording'

function computeState(
  availableFrom: string | null,
  duration: number | null,
  videoKey: string | null
): LessonState {
  if (videoKey) return 'recording'

  if (!availableFrom) return 'locked'

  const now = Date.now()
  const start = new Date(availableFrom).getTime()
  const durationMs = (duration ?? 120) * 60 * 1000
  const end = start + durationMs
  const joinWindow = start - 15 * 60 * 1000

  if (now < joinWindow) return 'locked'
  if (now <= end) return 'join'
  return 'pending'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin <= 0) return 'acum'
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function LessonCard({
  index,
  lessonId,
  editionSlug,
  title,
  duration,
  availableFrom,
  zoomLink,
  videoKey,
  pdfKeys,
  isWatched,
}: LessonCardProps) {
  const [state, setState] = useState<LessonState>(() =>
    computeState(availableFrom, duration, videoKey)
  )
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const tick = () => {
      const newState = computeState(availableFrom, duration, videoKey)
      setState(newState)

      if (newState === 'locked' && availableFrom) {
        const ms = new Date(availableFrom).getTime() - Date.now()
        setCountdown(formatCountdown(ms))
      } else if (newState === 'join' && availableFrom) {
        const start = new Date(availableFrom).getTime()
        const msToStart = start - Date.now()
        if (msToStart > 0) {
          setCountdown(`Începe în ${formatCountdown(msToStart)}`)
        } else {
          setCountdown('Live acum')
        }
      }
    }

    tick()
    const interval = setInterval(tick, 30_000)
    return () => clearInterval(interval)
  }, [availableFrom, duration, videoKey])

  const circleStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 700,
    flexShrink: 0,
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 12px rgba(81,8,126,0.08)',
        opacity: state === 'locked' ? 0.6 : 1,
        transition: 'all .2s',
      }}
    >
      <div
        style={{
          ...circleStyle,
          backgroundColor:
            state === 'recording' && isWatched
              ? '#027a48'
              : state === 'join'
                ? '#a007dc'
                : 'rgba(81,8,126,0.1)',
          color:
            state === 'recording' && isWatched
              ? 'white'
              : state === 'join'
                ? 'white'
                : '#51087e',
        }}
      >
        {state === 'recording' && isWatched ? '✓' : state === 'join' ? '●' : index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, color: '#51087e', margin: '0 0 2px' }}>{title}</p>

        {availableFrom && (
          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 2px' }}>
            {formatDate(availableFrom)}
          </p>
        )}

        {state === 'join' && (
          <p style={{ fontSize: '0.8rem', color: '#a007dc', margin: 0, fontWeight: 600 }}>
            {countdown}
          </p>
        )}

        {state === 'pending' && (
          <p style={{ fontSize: '0.8rem', color: '#b45309', margin: 0 }}>
            Înregistrarea și materialele urmează să fie postate
          </p>
        )}

        {state === 'recording' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {duration && (
              <span style={{ fontSize: '0.8rem', color: '#666' }}>{duration} min</span>
            )}
            {pdfKeys && pdfKeys.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: '#a007dc' }}>
                {pdfKeys.length} {pdfKeys.length === 1 ? 'material' : 'materiale'}
              </span>
            )}
          </div>
        )}
      </div>

      {state === 'locked' && (
        <span style={{ color: '#aaa', fontSize: '1.25rem' }}>🔒</span>
      )}

      {state === 'join' && zoomLink && (
        <a
          href={zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            backgroundColor: '#a007dc',
            borderRadius: '999px',
            padding: '0.5rem 1.25rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            animation: 'pulse 2s infinite',
          }}
        >
          Intră pe Zoom →
        </a>
      )}

      {state === 'pending' && (
        <span style={{ color: '#b45309', fontSize: '1.25rem' }}>⏳</span>
      )}

      {state === 'recording' && (
        <Link
          href={`/curs/${editionSlug}/lectia/${lessonId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            backgroundColor: '#a007dc',
            border: '1px solid #a007dc',
            borderRadius: '999px',
            padding: '0.5rem 1.25rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {isWatched ? 'Revizuiește' : 'Urmărește'} →
        </Link>
      )}
    </div>
  )
}
