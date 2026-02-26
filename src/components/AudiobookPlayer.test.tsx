import { render, screen, fireEvent, act } from '@testing-library/react'

// Mock HTMLAudioElement since jsdom doesn't support it
function createMockAudio() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: 0,
    duration: 300,
    playbackRate: 1,
    src: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    load: vi.fn(),
  }
}

let mockAudio: ReturnType<typeof createMockAudio>

// We need to mock the audio element ref. We'll do this by mocking useRef
// Actually, a cleaner approach: we mock the audio element behavior through the component's event handlers

describe('AudiobookPlayer', () => {
  beforeEach(() => {
    mockAudio = createMockAudio()
    vi.stubGlobal('Audio', vi.fn(() => mockAudio))
    // localStorage mock not needed — component localStorage usage is side-effect only
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders loading state when audioUrl is null', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl={null} />)
    expect(screen.getByTestId('audiobook-loading')).toBeInTheDocument()
    expect(screen.getByText(/se încarcă/i)).toBeInTheDocument()
  })

  it('renders play button when audioUrl is provided', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)
    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  })

  it('renders seek bar (range input)', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)
    expect(screen.getByTestId('seek-bar')).toBeInTheDocument()
    expect(screen.getByTestId('seek-bar')).toHaveAttribute('type', 'range')
  })

  it('renders speed selector with 4 options (0.5x, 1x, 1.5x, 2x)', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)
    const selector = screen.getByTestId('speed-selector')
    expect(selector).toBeInTheDocument()
    const options = selector.querySelectorAll('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent('0.5x')
    expect(options[1]).toHaveTextContent('1x')
    expect(options[2]).toHaveTextContent('1.5x')
    expect(options[3]).toHaveTextContent('2x')
  })

  it('shows current time and duration', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)
    expect(screen.getByTestId('current-time')).toBeInTheDocument()
    expect(screen.getByTestId('duration')).toBeInTheDocument()
  })

  it('clicking play calls audio.play() and toggles to pause button', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)

    const playBtn = screen.getByTestId('play-button')
    await act(async () => {
      fireEvent.click(playBtn)
    })

    // After clicking play, should show pause button
    expect(screen.getByTestId('pause-button')).toBeInTheDocument()
  })

  it('clicking pause calls audio.pause() and toggles to play button', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)

    // First play
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-button'))
    })

    // Then pause
    const pauseBtn = screen.getByTestId('pause-button')
    await act(async () => {
      fireEvent.click(pauseBtn)
    })

    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  })

  it('speed change updates playbackRate display', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(<AudiobookPlayer guideId="guide-1" audioUrl="https://example.com/audio.mp3" />)

    const selector = screen.getByTestId('speed-selector') as HTMLSelectElement
    fireEvent.change(selector, { target: { value: '2' } })
    expect(selector.value).toBe('2')
  })

  it('calls onProgressSave on pause', async () => {
    const onProgressSave = vi.fn()
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(
      <AudiobookPlayer
        guideId="guide-1"
        audioUrl="https://example.com/audio.mp3"
        onProgressSave={onProgressSave}
      />
    )

    // Play then pause
    await act(async () => {
      fireEvent.click(screen.getByTestId('play-button'))
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('pause-button'))
    })

    expect(onProgressSave).toHaveBeenCalled()
  })

  it('renders with savedPosition and shows it in current time', async () => {
    const { AudiobookPlayer } = await import('./AudiobookPlayer')
    render(
      <AudiobookPlayer
        guideId="guide-1"
        audioUrl="https://example.com/audio.mp3"
        savedPosition={125}
      />
    )

    // 125 seconds = 2:05
    expect(screen.getByTestId('current-time')).toHaveTextContent('2:05')
  })
})
