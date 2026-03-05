'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface AudiobookPlayerProps {
  guideId: string
  audioUrl: string | null
  savedPosition?: number
  onProgressSave?: (currentTime: number) => void
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function safeLocalStorage(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* SSR or restricted */ }
}

export function AudiobookPlayer({
  guideId,
  audioUrl,
  savedPosition = 0,
  onProgressSave,
}: AudiobookPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(savedPosition)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  // Save progress every 30s while playing
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime
        onProgressSave?.(time)
        safeLocalStorage(`audio-progress-${guideId}`, String(time))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isPlaying, onProgressSave, guideId])

  // Set saved position on mount
  useEffect(() => {
    if (audioRef.current && savedPosition > 0) {
      audioRef.current.currentTime = savedPosition
      setCurrentTime(savedPosition)
    }
  }, [savedPosition])

  const handlePlay = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      onProgressSave?.(time)
      safeLocalStorage(`audio-progress-${guideId}`, String(time))
    }
  }, [onProgressSave, guideId])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }, [])

  if (!audioUrl) {
    return (
      <div
        className="bg-[#51087e] text-white rounded-2xl p-4 flex items-center gap-3"
        data-testid="audiobook-loading"
      >
        <div className="animate-spin text-[#a007dc]">⟳</div>
        <span className="text-sm">Se încarcă audiobook-ul...</span>
      </div>
    )
  }

  return (
    <div
      className="bg-[#51087e] text-white rounded-2xl p-4 shadow-xl"
      data-testid="audiobook-player"
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() =>
          setCurrentTime(audioRef.current?.currentTime || 0)
        }
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0)
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-10 h-10 rounded-full bg-[#a007dc] flex items-center justify-center hover:bg-[#a007dc]/90 transition flex-shrink-0"
          aria-label={isPlaying ? 'Pauză' : 'Redă'}
          data-testid={isPlaying ? 'pause-button' : 'play-button'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time + Seek */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#a007dc]"
            aria-label="Poziție redare"
            data-testid="seek-bar"
          />
          <div className="flex justify-between text-xs text-white/60">
            <span data-testid="current-time">{formatTime(currentTime)}</span>
            <span data-testid="duration">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed selector */}
        <select
          value={speed}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
          className="bg-white/10 text-white text-sm rounded px-2 py-1 border border-white/20"
          aria-label="Viteză redare"
          data-testid="speed-selector"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
