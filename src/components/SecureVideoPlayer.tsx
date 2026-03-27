'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

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

export function SecureVideoPlayer({ hlsSrc, editionId, lessonId: _lessonId, onProgress }: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsInstance | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [quality, setQuality] = useState('720')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // Fetch signed video URL from our API
  const fetchVideoUrl = useCallback(async () => {
    if (!hlsSrc) return null
    try {
      const res = await fetch(
        `/api/video/url?editionId=${editionId}&videoId=${encodeURIComponent(hlsSrc)}`,
        { headers: { 'x-device-fingerprint': localStorage.getItem('device-fingerprint') || '' } }
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
    <div className="relative bg-black rounded-2xl overflow-hidden" data-testid="secure-video-player">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onTimeUpdate={() => onProgress?.(videoRef.current?.currentTime ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-[#a007dc] transition"
            aria-label={isPlaying ? 'Pauză' : 'Redă'}
            data-testid={isPlaying ? 'pause-button' : 'play-button'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

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
