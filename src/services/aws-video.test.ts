import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @aws-sdk/cloudfront-signer
vi.mock('@aws-sdk/cloudfront-signer', () => ({
  getSignedCookies: vi.fn().mockResolvedValue({
    'CloudFront-Policy': 'mock-policy-value',
    'CloudFront-Signature': 'mock-signature-value',
    'CloudFront-Key-Pair-Id': 'mock-key-pair-id-value',
  }),
}))

// Mock @aws-sdk/client-mediaconvert
vi.mock('@aws-sdk/client-mediaconvert', () => {
  const mockSend = vi.fn().mockResolvedValue({
    Job: {
      Id: 'job-12345',
      Status: 'SUBMITTED',
      CreatedAt: new Date('2026-01-15T10:00:00Z'),
    },
  })
  return {
    MediaConvertClient: vi.fn(() => ({ send: mockSend })),
    CreateJobCommand: vi.fn(),
    GetJobCommand: vi.fn(),
  }
})

describe('AWS Video Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      AWS_CLOUDFRONT_DOMAIN: 'cdn.perspectivaevei.com',
      AWS_CLOUDFRONT_KEY_PAIR_ID: 'KTEST123',
      AWS_CLOUDFRONT_PRIVATE_KEY: Buffer.from('-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----').toString('base64'),
      AWS_REGION: 'eu-central-1',
      AWS_MEDIACONVERT_ENDPOINT: 'https://mediaconvert.eu-central-1.amazonaws.com',
      AWS_ACCESS_KEY_ID: 'AKIATEST',
      AWS_SECRET_ACCESS_KEY: 'secret-test',
      AWS_S3_BUCKET: 'perspectiva-evei-video',
      AWS_MEDIACONVERT_ROLE_ARN: 'arn:aws:iam::123456789:role/MediaConvertRole',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateSignedCookies', () => {
    it('returns all 3 required CloudFront cookies', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookies).toHaveProperty('CloudFront-Policy')
      expect(result.cookies).toHaveProperty('CloudFront-Signature')
      expect(result.cookies).toHaveProperty('CloudFront-Key-Pair-Id')
    })

    it('has maxAge of 7200 seconds (2 hours TTL)', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.maxAge).toBe(7200)
    })

    it('has cookie domain .perspectivaevei.com (leading dot for cross-subdomain)', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.domain).toBe('.perspectivaevei.com')
    })

    it('has secure flag set to true', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.secure).toBe(true)
    })

    it('has httpOnly flag set to true', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.httpOnly).toBe(true)
    })

    it('has sameSite set to none (required for cross-origin cookie sending)', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.sameSite).toBe('none')
    })

    it('has path set to /', async () => {
      const { generateSignedCookies } = await import('./aws-video')
      const result = await generateSignedCookies('user-123')

      expect(result.cookieOptions.path).toBe('/')
    })

    it('throws when CloudFront config env vars are missing', async () => {
      delete process.env.AWS_CLOUDFRONT_DOMAIN
      delete process.env.AWS_CLOUDFRONT_KEY_PAIR_ID
      delete process.env.AWS_CLOUDFRONT_PRIVATE_KEY

      // Re-import to get fresh module
      vi.resetModules()
      vi.mock('@aws-sdk/cloudfront-signer', () => ({
        getSignedCookies: vi.fn().mockResolvedValue({
          'CloudFront-Policy': 'mock-policy-value',
          'CloudFront-Signature': 'mock-signature-value',
          'CloudFront-Key-Pair-Id': 'mock-key-pair-id-value',
        }),
      }))
      vi.mock('@aws-sdk/client-mediaconvert', () => {
        const mockSend = vi.fn().mockResolvedValue({
          Job: { Id: 'job-12345', Status: 'SUBMITTED', CreatedAt: new Date('2026-01-15T10:00:00Z') },
        })
        return {
          MediaConvertClient: vi.fn(() => ({ send: mockSend })),
          CreateJobCommand: vi.fn(),
          GetJobCommand: vi.fn(),
        }
      })

      const { generateSignedCookies } = await import('./aws-video')

      await expect(generateSignedCookies('user-123')).rejects.toThrow(
        'CloudFront configuration missing'
      )
    })

    it('calls getSignedCookies with correct policy structure', async () => {
      const { getSignedCookies } = await import('@aws-sdk/cloudfront-signer')
      const { generateSignedCookies } = await import('./aws-video')

      await generateSignedCookies('user-123', '/video/*')

      expect(getSignedCookies).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPairId: 'KTEST123',
          policy: expect.stringContaining('/video/*'),
        })
      )
    })
  })

  describe('refreshSignedCookies', () => {
    it('returns same structure as generateSignedCookies', async () => {
      const { refreshSignedCookies } = await import('./aws-video')
      const result = await refreshSignedCookies('user-123')

      expect(result.cookies).toHaveProperty('CloudFront-Policy')
      expect(result.cookies).toHaveProperty('CloudFront-Signature')
      expect(result.cookies).toHaveProperty('CloudFront-Key-Pair-Id')
      expect(result.cookieOptions.maxAge).toBe(7200)
    })
  })

  describe('createTranscodeJob', () => {
    it('returns job result with id, status, and createdAt', async () => {
      const { createTranscodeJob } = await import('./aws-video')
      const result = await createTranscodeJob({
        s3InputKey: 'uploads/raw/video.mp4',
        outputPrefix: 'video/hls/video-123',
      })

      expect(result.jobId).toBe('job-12345')
      expect(result.status).toBe('SUBMITTED')
      expect(result.createdAt).toBe('2026-01-15T10:00:00.000Z')
    })

    it('creates MediaConvert client with correct region', async () => {
      const { MediaConvertClient } = await import('@aws-sdk/client-mediaconvert')
      const { createTranscodeJob } = await import('./aws-video')

      await createTranscodeJob({
        s3InputKey: 'uploads/raw/video.mp4',
        outputPrefix: 'video/hls/video-123',
      })

      expect(MediaConvertClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'eu-central-1',
        })
      )
    })
  })

  describe('getTranscodeJobStatus', () => {
    it('returns job status for given jobId', async () => {
      const { getTranscodeJobStatus } = await import('./aws-video')
      const result = await getTranscodeJobStatus('job-12345')

      expect(result.jobId).toBe('job-12345')
      expect(result.status).toBe('SUBMITTED')
      expect(result.createdAt).toBe('2026-01-15T10:00:00.000Z')
    })
  })
})
