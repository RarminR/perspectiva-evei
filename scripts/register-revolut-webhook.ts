import { config } from 'dotenv'

config({ path: '.env.local' })

const REVOLUT_API_VERSION = '2025-12-04'

function getBaseUrl(env: string): string {
  return env === 'production'
    ? 'https://merchant.revolut.com/api/1.0'
    : 'https://sandbox-merchant.revolut.com/api/1.0'
}

async function listWebhooks(baseUrl: string, apiKey: string) {
  const res = await fetch(`${baseUrl}/webhooks`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Revolut-Api-Version': REVOLUT_API_VERSION,
    },
  })
  if (!res.ok) {
    throw new Error(`List webhooks failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<Array<{ id: string; url: string; events: string[] }>>
}

async function deleteWebhook(baseUrl: string, apiKey: string, webhookId: string) {
  const res = await fetch(`${baseUrl}/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Revolut-Api-Version': REVOLUT_API_VERSION,
    },
  })
  if (!res.ok) {
    throw new Error(`Delete webhook failed: ${res.status} ${await res.text()}`)
  }
}

async function createWebhook(baseUrl: string, apiKey: string, url: string) {
  const res = await fetch(`${baseUrl}/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Revolut-Api-Version': REVOLUT_API_VERSION,
    },
    body: JSON.stringify({
      url,
      events: ['ORDER_COMPLETED', 'ORDER_FAILED', 'ORDER_CANCELLED'],
    }),
  })
  if (!res.ok) {
    throw new Error(`Create webhook failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{ id: string; url: string; signing_secret: string; events: string[] }>
}

async function main() {
  const apiKey = process.env.REVOLUT_API_KEY
  const env = process.env.REVOLUT_ENVIRONMENT || 'sandbox'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!apiKey) {
    console.error('Error: REVOLUT_API_KEY is not set in .env.local')
    process.exit(1)
  }

  if (!appUrl) {
    console.error('Error: NEXT_PUBLIC_APP_URL is not set in .env.local')
    process.exit(1)
  }

  const webhookUrl = `${appUrl}/api/webhooks/revolut`
  const baseUrl = getBaseUrl(env)

  console.log(`\nRevolut Webhook Registration`)
  console.log(`Environment : ${env}`)
  console.log(`Webhook URL : ${webhookUrl}`)
  console.log(`API base    : ${baseUrl}\n`)

  // Remove any existing webhooks pointing to the same URL to avoid duplicates
  console.log('Checking existing webhooks...')
  const existing = await listWebhooks(baseUrl, apiKey)
  const duplicates = existing.filter((w) => w.url === webhookUrl)

  if (duplicates.length > 0) {
    console.log(`Removing ${duplicates.length} existing webhook(s) for this URL...`)
    for (const w of duplicates) {
      await deleteWebhook(baseUrl, apiKey, w.id)
      console.log(`  Deleted: ${w.id}`)
    }
  }

  console.log('Registering new webhook...')
  const webhook = await createWebhook(baseUrl, apiKey, webhookUrl)

  console.log('\n✓ Webhook registered successfully\n')
  console.log(`  Webhook ID : ${webhook.id}`)
  console.log(`  URL        : ${webhook.url}`)
  console.log(`  Events     : ${webhook.events.join(', ')}`)
  console.log(`\n  REVOLUT_WEBHOOK_SECRET=${webhook.signing_secret}`)
  console.log('\nAdd the REVOLUT_WEBHOOK_SECRET above to your .env.local and Vercel environment variables.\n')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
