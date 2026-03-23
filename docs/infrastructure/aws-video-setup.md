# AWS Video Infrastructure Setup

## Architecture Overview

```
┌──────────┐    upload     ┌─────────┐   trigger   ┌───────────────┐
│  Admin   │──────────────▶│   S3    │────────────▶│ MediaConvert  │
│  Panel   │               │ (input) │             │ (transcode)   │
└──────────┘               └─────────┘             └───────┬───────┘
                                                           │
                                                    HLS output
                                                           │
┌──────────┐  signed cookies ┌────────────┐         ┌──────▼──────┐
│ Student  │◀───────────────│ CloudFront │◀────────│     S3      │
│ Browser  │───────────────▶│   (CDN)    │  OAC    │  (output)   │
│ (hls.js) │   HLS request  └────────────┘         └─────────────┘
└──────────┘
```

- **S3**: Stores raw uploads and HLS output (single bucket, separate prefixes)
- **MediaConvert**: Transcodes to 720p/480p/360p HLS with 6s segments
- **CloudFront**: CDN with signed cookies for authenticated HLS delivery
- **hls.js**: Client-side player with `withCredentials: true` for cookie passthrough

## S3 Bucket Configuration

### Create Bucket

```bash
aws s3api create-bucket \
  --bucket perspectiva-evei-video \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1
```

### Enable Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket perspectiva-evei-video \
  --versioning-configuration Status=Enabled
```

### Block All Public Access

```bash
aws s3api put-public-access-block \
  --bucket perspectiva-evei-video \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### CORS Configuration

**CRITICAL**: Explicit `AllowedOrigins` — never use `*` when credentials are involved.

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": [
        "https://perspectivaevei.com",
        "https://www.perspectivaevei.com",
        "https://app.perspectivaevei.com"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

```bash
aws s3api put-bucket-cors \
  --bucket perspectiva-evei-video \
  --cors-configuration file://cors-config.json
```

### Bucket Structure

```
perspectiva-evei-video/
├── uploads/raw/           # Raw video uploads from admin
├── video/hls/             # Transcoded HLS output
│   └── {video-id}/
│       ├── master.m3u8    # Master playlist (ABR)
│       ├── _720p/         # 720p rendition
│       ├── _480p/         # 480p rendition
│       └── _360p/         # 360p rendition
└── thumbnails/            # Video thumbnails
```

  ## CloudFront Distribution

### Origin Access Control (OAC) — NOT OAI

**CRITICAL**: OAI is deprecated. Use OAC with SigV4.

```bash
# Create OAC
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    Name=perspectiva-evei-video-oac,\
    Description="OAC for video S3 bucket",\
    SigningProtocol=sigv4,\
    SigningBehavior=always,\
    OriginAccessControlOriginType=s3
```

### S3 Bucket Policy for OAC

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::perspectiva-evei-video/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### Distribution Settings

| Setting | Value |
|---------|-------|
| Origin | `perspectiva-evei-video.s3.eu-central-1.amazonaws.com` |
| Origin Access | OAC (SigV4) |
| Viewer Protocol | HTTPS only |
| Allowed Methods | GET, HEAD, OPTIONS |
| Cache Policy | CachingOptimized |
| Origin Request Policy | CORS-S3Origin |
| Response Headers Policy | Custom (see below) |
| Price Class | PriceClass_100 (EU + NA) |
| Alternate Domain | `cdn.perspectivaevei.com` |
| SSL Certificate | ACM (us-east-1) for `cdn.perspectivaevei.com` |

### Cache Key Policy — MUST Include Origin

**CRITICAL**: Include `Origin` header in the cache key policy to prevent CORS bugs. Without this, CloudFront may cache a response without CORS headers and serve it to a different origin.

```json
{
  "Name": "perspectiva-evei-video-cache-policy",
  "DefaultTTL": 86400,
  "MaxTTL": 31536000,
  "MinTTL": 0,
  "ParametersInCacheKeyAndForwardedToOrigin": {
    "EnableAcceptEncodingGzip": true,
    "EnableAcceptEncodingBrotli": true,
    "HeadersConfig": {
      "HeaderBehavior": "whitelist",
      "Headers": {
        "Items": ["Origin"]
      }
    },
    "CookiesConfig": {
      "CookieBehavior": "none"
    },
    "QueryStringsConfig": {
      "QueryStringBehavior": "none"
    }
  }
}
```

### Response Headers Policy

```json
{
  "Name": "perspectiva-evei-cors-headers",
  "CorsConfig": {
    "AccessControlAllowOrigins": {
      "Items": [
        "https://perspectivaevei.com",
        "https://www.perspectivaevei.com",
        "https://app.perspectivaevei.com"
      ]
    },
    "AccessControlAllowHeaders": {
      "Items": ["*"]
    },
    "AccessControlAllowMethods": {
      "Items": ["GET", "HEAD", "OPTIONS"]
    },
    "AccessControlAllowCredentials": true,
    "AccessControlMaxAgeSec": 3600,
    "OriginOverride": true
  },
  "CustomHeadersConfig": {
    "Items": [
      {
        "Header": "Vary",
        "Value": "Origin",
        "Override": true
      }
    ]
  }
}
```

**CRITICAL**: `Vary: Origin` MUST be set on all responses.

### Trusted Key Groups (Signed Cookies)

**CRITICAL**: Use ECDSA P-256 keys (faster than RSA-2048).

```bash
# Generate ECDSA P-256 key pair
openssl ecparam -genkey -name prime256v1 -noout -out private_key.pem
openssl ec -in private_key.pem -pubout -out public_key.pem

# Upload public key to CloudFront
aws cloudfront create-public-key \
  --public-key-config \
    CallerReference=$(date +%s),\
    Name=perspectiva-evei-signing-key,\
    EncodedKey="$(cat public_key.pem)"

# Create key group with the public key
aws cloudfront create-key-group \
  --key-group-config \
    Name=perspectiva-evei-key-group,\
    Items=PUBLIC_KEY_ID

# Store private key as base64 in environment
cat private_key.pem | base64 -w0 > private_key_b64.txt
# Set AWS_CLOUDFRONT_PRIVATE_KEY env var to contents of private_key_b64.txt
```

### Signed Cookies Configuration

- **Cookie TTL**: 2 hours (7200 seconds)
- **Frontend refresh**: Every 90 minutes (before expiry)
- **Cookie domain**: `.perspectivaevei.com` (leading dot for cross-subdomain)
- **Required cookies**: `CloudFront-Policy`, `CloudFront-Signature`, `CloudFront-Key-Pair-Id`
- **Cookie flags**: `Secure`, `HttpOnly`, `SameSite=None`

**Known issue**: hls.js + CloudFront signed cookies + CORS requires careful configuration. See [hls.js #2620](https://github.com/video-dev/hls.js/issues/2620). Solution: set `xhrSetup` with `withCredentials: true`.

```typescript
// hls.js configuration in frontend
const hls = new Hls({
  xhrSetup: (xhr) => {
    xhr.withCredentials = true
  },
})
```

## MediaConvert Setup

### IAM Role for MediaConvert

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "mediaconvert.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Permissions policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::perspectiva-evei-video/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::perspectiva-evei-video"
    }
  ]
}
```

### Get MediaConvert Endpoint

```bash
aws mediaconvert describe-endpoints --region eu-central-1
# Returns: https://xxxxx.mediaconvert.eu-central-1.amazonaws.com
# Store as AWS_MEDIACONVERT_ENDPOINT env var
```

### Job Template

HLS output with adaptive bitrate streaming:

| Rendition | Resolution | Video Bitrate | Audio Bitrate | Audio Sample Rate |
|-----------|-----------|---------------|---------------|-------------------|
| 720p | 1280x720 | 3 Mbps | 128 kbps | 48 kHz |
| 480p | 854x480 | 1.5 Mbps | 128 kbps | 48 kHz |
| 360p | 640x360 | 800 kbps | 96 kbps | 48 kHz |

- **Segment length**: 6 seconds
- **Codec**: H.264 (video), AAC (audio)
- **Rate control**: CBR

### Application IAM Policy

The application (Next.js backend) needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Upload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::perspectiva-evei-video",
        "arn:aws:s3:::perspectiva-evei-video/*"
      ]
    },
    {
      "Sid": "MediaConvertJobs",
      "Effect": "Allow",
      "Action": [
        "mediaconvert:CreateJob",
        "mediaconvert:GetJob",
        "mediaconvert:ListJobs",
        "mediaconvert:DescribeEndpoints"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PassRoleToMediaConvert",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::ACCOUNT_ID:role/MediaConvertRole"
    }
  ]
}
```

## Environment Variables

```bash
# CloudFront
AWS_CLOUDFRONT_DOMAIN=cdn.perspectivaevei.com
AWS_CLOUDFRONT_KEY_PAIR_ID=K1234ABCDEF       # from key group setup
AWS_CLOUDFRONT_PRIVATE_KEY=<base64-encoded-private-key-pem>

# AWS Credentials
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# S3
AWS_S3_BUCKET=perspectiva-evei-video

# MediaConvert
AWS_MEDIACONVERT_ENDPOINT=https://xxxxx.mediaconvert.eu-central-1.amazonaws.com
AWS_MEDIACONVERT_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/MediaConvertRole
```

## Cost Estimates

### 15 Students (Current Scale)

| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| S3 Storage | ~50 GB (20 videos × 3 renditions) | ~$1.15 |
| S3 Requests | ~150,000 GET/month | ~$0.06 |
| CloudFront | ~150 GB transfer/month | ~$12.75 |
| MediaConvert | ~10 hours transcoding/month | ~$4.80 |
| **Total** | | **~$19/month** |

### 100 Concurrent Students

| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| S3 Storage | ~200 GB | ~$4.60 |
| S3 Requests | ~1,000,000 GET/month | ~$0.40 |
| CloudFront | ~2 TB transfer/month | ~$170 |
| MediaConvert | ~40 hours transcoding/month | ~$19.20 |
| **Total** | | **~$194/month** |

> Note: CloudFront costs can be reduced with Reserved Capacity commitments for predictable traffic. Cost estimates are for `eu-central-1` region using on-demand pricing as of 2026.

## Security Checklist

- [ ] S3 bucket has all public access blocked
- [ ] CloudFront uses OAC (NOT deprecated OAI)
- [ ] Signed cookies use ECDSA P-256 keys
- [ ] Cookie domain is `.perspectivaevei.com` (with leading dot)
- [ ] CORS uses explicit AllowedOrigins (not `*`)
- [ ] `Vary: Origin` header set on all CloudFront responses
- [ ] `Origin` included in CloudFront cache key policy
- [ ] Private key stored as base64 env var (NOT in filesystem)
- [ ] MediaConvert role has least-privilege S3 access
- [ ] Application IAM user has least-privilege permissions
- [ ] Cookie TTL is 2 hours with 90-minute frontend refresh
