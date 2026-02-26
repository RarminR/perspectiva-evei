import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'

const handlers = new Map<string, Array<(...args: unknown[]) => void>>()

vi.mock('hls.js', () => {
  class MockHls {
    static Events = {
      MANIFEST_PARSED: 'MANIFEST_PARSED',
      ERROR: 'ERROR',
    }

    static isSupported() {
      return true
    }

    levels = [
      { height: 720 },
      { height: 480 },
      { height: 360 },
    ]

    loadSource = vi.fn()
    attachMedia = vi.fn()
    destroy = vi.fn()

    on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const existing = handlers.get(event) ?? []
      handlers.set(event, [...existing, cb])
      if (event === MockHls.Events.MANIFEST_PARSED) {
        cb()
      }
    })
  }

  return { default: MockHls }
})

describe('SecureVideoPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    handlers.clear()
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders video element', async () => {
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(<SecureVideoPlayer hlsSrc="https://cdn.example.com/master.m3u8" editionId="ed-1" lessonId="lesson-1" />)

    expect(screen.getByTestId('secure-video-player')).toBeInTheDocument()
    expect(document.querySelector('video')).toBeInTheDocument()
  })

  it('renders quality selector with 720p, 480p, 360p options', async () => {
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(<SecureVideoPlayer hlsSrc="https://cdn.example.com/master.m3u8" editionId="ed-1" lessonId="lesson-1" />)

    const selector = screen.getByTestId('quality-selector')
    expect(selector).toBeInTheDocument()
    const options = selector.querySelectorAll('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('720p')
    expect(options[1]).toHaveTextContent('480p')
    expect(options[2]).toHaveTextContent('360p')
  })

  it('renders play/pause button', async () => {
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(<SecureVideoPlayer hlsSrc="https://cdn.example.com/master.m3u8" editionId="ed-1" lessonId="lesson-1" />)

    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  })

  it('shows error message when src is null', async () => {
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(<SecureVideoPlayer hlsSrc={null} editionId="ed-1" lessonId="lesson-1" />)

    expect(screen.getByTestId('video-no-src')).toBeInTheDocument()
    expect(screen.getByText('Video indisponibil.')).toBeInTheDocument()
  })

  it('shows Romanian access denied error on refresh 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 403 }))
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(<SecureVideoPlayer hlsSrc="https://cdn.example.com/master.m3u8" editionId="ed-1" lessonId="lesson-1" />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90 * 60 * 1000)
    })

    expect(screen.getByTestId('video-error')).toBeInTheDocument()
    expect(screen.getByText('Accesul tău a expirat. Te rugăm să contactezi suportul.')).toBeInTheDocument()
  })

  it('tracks progress via onProgress callback', async () => {
    const onProgress = vi.fn()
    const { SecureVideoPlayer } = await import('./SecureVideoPlayer')

    render(
      <SecureVideoPlayer
        hlsSrc="https://cdn.example.com/master.m3u8"
        editionId="ed-1"
        lessonId="lesson-1"
        onProgress={onProgress}
      />
    )

    const video = document.querySelector('video') as HTMLVideoElement
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      value: 42,
    })

    fireEvent.timeUpdate(video)

    expect(onProgress).toHaveBeenCalledWith(42)
  })
})
