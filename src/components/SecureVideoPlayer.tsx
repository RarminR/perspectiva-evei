'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ensureDeviceRegistered } from '@/lib/device-fingerprint'

interface SecureVideoPlayerProps {
  hlsSrc: string | null
  editionId: string
  lessonId: string
  onProgress?: (watchedSeconds: number) => void
}

type HlsInstance = {
  loadSource: (src: string) => void
  attachMedia: (media: HTMLMediaElement) => void
  on: (event: string, cb: (...args: any[]) => void) => void
  destroy: () => void
  levels?: Array<{ height?: number }>
  currentLevel?: number
}

const QUALITY_OPTIONS = [
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
]

const REFRESH_INTERVAL_MS = 90 * 60 * 1000

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SecureVideoPlayer({ hlsSrc, editionId, lessonId: _lessonId, onProgress }: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<HlsInstance | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [quality, setQuality] = useState('720')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // Fetch signed video URL from our API
  const fetchVideoUrl = useCallback(async () => {
    if (!hlsSrc) return null
    try {
      // Register this device (idempotent) and get its fingerprint
      const { fingerprint, error: registrationError } = await ensureDeviceRegistered()
      if (registrationError) {
        setError(registrationError)
        return null
      }

      const res = await fetch(
        `/api/video/url?editionId=${editionId}&videoId=${encodeURIComponent(hlsSrc)}`,
        { headers: { 'x-device-fingerprint': fingerprint } }
      )
      if (res.status === 403) {
        setError('Accesul tău a expirat. Te rugăm să contactezi suportul.')
        return null
      }
      if (!res.ok) return null
      const data = await res.json()
      return data.url as string
    } catch {
      return null
    }
  }, [hlsSrc, editionId])

  // Initial fetch
  useEffect(() => {
    if (!hlsSrc) return
    fetchVideoUrl().then((url) => {
      if (url) setVideoUrl(url)
    })
  }, [hlsSrc, fetchVideoUrl])

  // Refresh URL periodically
  useEffect(() => {
    if (!hlsSrc) return
    const timer = setInterval(async () => {
      const url = await fetchVideoUrl()
      if (url) setVideoUrl(url)
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [hlsSrc, fetchVideoUrl])

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return

    let active = true

    const init = async () => {
      const hlsModule = await import('hls.js')
      const Hls = hlsModule.default

      if (!active || !videoRef.current) return

      if (Hls.isSupported()) {
        const hls = new Hls() as HlsInstance

        hlsRef.current = hls
        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!active) return
          setIsLoading(false)
        })

        hls.on(Hls.Events.ERROR, (...args: unknown[]) => {
          const data = (args[1] as { fatal?: boolean; response?: { code?: number } } | undefined) ?? {}
          if (!active) return

          if (data?.response?.code === 403) {
            hls.destroy()
            setError('Nu ai acces la acest video.')
            return
          }

          if (data?.fatal) {
            setError('Eroare la redarea videoclipului. Te rugăm să reîncerci.')
          }
        })

        return
      }

      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl
        setIsLoading(false)
      } else {
        setError('Browser-ul tău nu suportă redarea acestui video.')
      }
    }

    void init()

    return () => {
      active = false
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [videoUrl])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
      return
    }

    void videoRef.current.play()
    setIsPlaying(true)
  }, [isPlaying])

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const handleSkip = useCallback((deltaSeconds: number) => {
    const video = videoRef.current
    if (!video) return
    const target = Math.min(Math.max(video.currentTime + deltaSeconds, 0), video.duration || Infinity)
    video.currentTime = target
    setCurrentTime(target)
  }, [])

  // Keep fullscreen state in sync (Esc key, system UI, etc.)
  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null }
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const handleFullscreenToggle = useCallback(() => {
    const container = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null
      webkitExitFullscreen?: () => void
    }

    if (document.fullscreenElement || doc.webkitFullscreenElement) {
      if (document.exitFullscreen) void document.exitFullscreen()
      else doc.webkitExitFullscreen?.()
      return
    }

    if (container?.requestFullscreen) {
      void container.requestFullscreen()
    } else if (container?.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    } else if (video?.webkitEnterFullscreen) {
      // iPhone Safari: only the native video fullscreen is available
      video.webkitEnterFullscreen()
    }
  }, [])

  const handleQualityChange = useCallback((newQuality: string) => {
    setQuality(newQuality)

    const hls = hlsRef.current
    if (!hls?.levels?.length) return

    const targetHeight = Number(newQuality)
    const levelIndex = hls.levels.findIndex((level) => level.height === targetHeight)
    if (levelIndex >= 0) {
      hls.currentLevel = levelIndex
    }
  }, [])

  if (!hlsSrc) {
    return (
      <div
        className="bg-black rounded-2xl aspect-video flex items-center justify-center"
        data-testid="video-no-src"
      >
        <p className="text-white/60 text-sm">Video indisponibil.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-black rounded-2xl aspect-video flex items-center justify-center"
        data-testid="video-error"
      >
        <p className="text-red-400 text-sm text-center px-4">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden"
      data-testid="secure-video-player"
    >
      <video
        ref={videoRef}
        className={isFullscreen ? 'w-full h-full' : 'w-full aspect-video'}
        onTimeUpdate={() => {
          const time = videoRef.current?.currentTime ?? 0
          setCurrentTime(time)
          onProgress?.(time)
        }}
        onDurationChange={() => {
          const d = videoRef.current?.duration
          if (d && Number.isFinite(d)) setDuration(d)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => handleSeek(Number(event.target.value))}
          disabled={!duration}
          className="w-full h-1.5 mb-3 cursor-pointer accent-[#a007dc]"
          aria-label="Derulează video"
          data-testid="seek-bar"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-[#a007dc] transition"
            aria-label={isPlaying ? 'Pauză' : 'Redă'}
            data-testid={isPlaying ? 'pause-button' : 'play-button'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={() => handleSkip(-10)}
            className="text-white hover:text-[#a007dc] transition text-xs font-medium"
            aria-label="Înapoi 10 secunde"
            data-testid="skip-back-button"
          >
            -10s
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="text-white hover:text-[#a007dc] transition text-xs font-medium"
            aria-label="Înainte 10 secunde"
            data-testid="skip-forward-button"
          >
            +10s
          </button>

          <span className="text-white/80 text-xs tabular-nums" data-testid="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <select
            value={quality}
            onChange={(event) => handleQualityChange(event.target.value)}
            className="bg-black/50 text-white text-xs rounded px-2 py-1 border border-white/20"
            aria-label="Calitate video"
            data-testid="quality-selector"
          >
            {QUALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleFullscreenToggle}
            className="text-white hover:text-[#a007dc] transition"
            aria-label={isFullscreen ? 'Ieși din ecran complet' : 'Ecran complet'}
            data-testid="fullscreen-button"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m5 5V5m0 4H5m10 0l5-5m-5 5V5m0 4h4M9 15l-5 5m5-5v4m0-4H5m10 0l5 5m-5-5v4m0-4h4" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin text-[#a007dc] text-2xl">⟳</div>
        </div>
      ) : null}
    </div>
  )
}
