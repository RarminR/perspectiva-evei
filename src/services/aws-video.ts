import { getSignedCookies } from "@aws-sdk/cloudfront-signer"
import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
} from "@aws-sdk/client-mediaconvert"
import type {
  SignedCookiesResult,
  TranscodeJobParams,
  TranscodeJobResult,
} from "@/types/aws-video"

const COOKIE_TTL_SECONDS = 7200 // 2 hours
const COOKIE_DOMAIN = ".perspectivaevei.com"

function getCloudFrontConfig() {
  const domain = process.env.AWS_CLOUDFRONT_DOMAIN
  const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID
  const privateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY

  if (!domain || !keyPairId || !privateKey) {
    throw new Error("CloudFront configuration missing")
  }

  // Private key is stored as base64 in env
  const privateKeyPem = Buffer.from(privateKey, "base64").toString("utf-8")

  return { domain, keyPairId, privateKeyPem }
}

/**
 * Generate CloudFront signed cookies for HLS video access.
 * CRITICAL: Uses signed cookies (not signed URLs) for HLS multi-segment streaming.
 * CRITICAL: Cookie domain must be ".perspectivaevei.com" (leading dot for cross-subdomain).
 * CRITICAL: Include Origin in CloudFront cache key policy (CORS bug prevention).
 */
export async function generateSignedCookies(
  _userId: string,
  resourcePath: string = "/video/*"
): Promise<SignedCookiesResult> {
  const { domain, keyPairId, privateKeyPem } = getCloudFrontConfig()

  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS
  const resourceUrl = `https://${domain}${resourcePath}`

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: resourceUrl,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expiresAt },
        },
      },
    ],
  })

  const cookies = await getSignedCookies({
    keyPairId,
    privateKey: privateKeyPem,
    policy,
  })

  return {
    cookies: {
      "CloudFront-Policy": cookies["CloudFront-Policy"]!,
      "CloudFront-Signature": cookies["CloudFront-Signature"]!,
      "CloudFront-Key-Pair-Id": cookies["CloudFront-Key-Pair-Id"]!,
    },
    cookieOptions: {
      domain: COOKIE_DOMAIN,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: COOKIE_TTL_SECONDS,
    },
  }
}

/**
 * Refresh signed cookies (called every 90 minutes by frontend).
 * Returns new cookies if user still has access, throws if access revoked.
 */
export async function refreshSignedCookies(
  userId: string,
  resourcePath: string = "/video/*"
): Promise<SignedCookiesResult> {
  // Access check is done by the API route before calling this
  return generateSignedCookies(userId, resourcePath)
}

function createMediaConvertClient(): MediaConvertClient {
  return new MediaConvertClient({
    region: process.env.AWS_REGION || "eu-central-1",
    endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Submit a MediaConvert transcoding job for HLS output.
 * CRITICAL: Use AWS MediaConvert (Elastic Transcoder was discontinued Nov 2025).
 * Output: 720p + 480p + 360p HLS renditions, 6-second segments.
 */
export async function createTranscodeJob(
  params: TranscodeJobParams
): Promise<TranscodeJobResult> {
  const client = createMediaConvertClient()

  const inputBucket = process.env.AWS_S3_BUCKET
  const outputBucket = process.env.AWS_S3_BUCKET

  const jobSettings = {
    Inputs: [
      {
        FileInput: `s3://${inputBucket}/${params.s3InputKey}`,
        AudioSelectors: {
          "Audio Selector 1": { DefaultSelection: "DEFAULT" },
        },
      },
    ],
    OutputGroups: [
      {
        Name: "HLS Group",
        OutputGroupSettings: {
          Type: "HLS_GROUP_SETTINGS",
          HlsGroupSettings: {
            SegmentLength: 6,
            Destination: `s3://${outputBucket}/${params.outputPrefix}/`,
            MinSegmentLength: 0,
          },
        },
        Outputs: [
          // 720p
          {
            NameModifier: "_720p",
            VideoDescription: {
              Width: 1280,
              Height: 720,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 3000000,
                  RateControlMode: "CBR",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 128000, SampleRate: 48000 },
                },
              },
            ],
            ContainerSettings: { Container: "M3U8" },
          },
          // 480p
          {
            NameModifier: "_480p",
            VideoDescription: {
              Width: 854,
              Height: 480,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 1500000,
                  RateControlMode: "CBR",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 128000, SampleRate: 48000 },
                },
              },
            ],
            ContainerSettings: { Container: "M3U8" },
          },
          // 360p
          {
            NameModifier: "_360p",
            VideoDescription: {
              Width: 640,
              Height: 360,
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  Bitrate: 800000,
                  RateControlMode: "CBR",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: { Bitrate: 96000, SampleRate: 48000 },
                },
              },
            ],
            ContainerSettings: { Container: "M3U8" },
          },
        ],
      },
    ],
  }

  const command = new CreateJobCommand({
    Role: process.env.AWS_MEDIACONVERT_ROLE_ARN,
    Settings: jobSettings as never,
    ...(params.jobTemplateName
      ? { JobTemplate: params.jobTemplateName }
      : {}),
  })

  const result = await client.send(command)

  return {
    jobId: result.Job!.Id!,
    status: result.Job!.Status!,
    createdAt: result.Job!.CreatedAt!.toISOString(),
  }
}

export async function getTranscodeJobStatus(
  jobId: string
): Promise<TranscodeJobResult> {
  const client = createMediaConvertClient()

  const command = new GetJobCommand({ Id: jobId })
  const result = await client.send(command)

  return {
    jobId: result.Job!.Id!,
    status: result.Job!.Status!,
    createdAt: result.Job!.CreatedAt!.toISOString(),
  }
}
