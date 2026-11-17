import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import { auth } from '@/lib/auth'

/**
 * Funcția de retragere online (Directiva (UE) 2023/2673, art. 11a din Directiva 2011/83/UE,
 * aplicabilă din 19 iunie 2026): consumatorul trimite declarația de retragere de pe platformă,
 * iar noi confirmăm primirea pe e-mail (suport durabil), cu conținutul și data și ora primirii.
 */
const TRADER_EMAIL = 'estedespremine@gmail.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
  }

  const name = clean(body.name, 120)
  const email = clean(body.email, 200)
  const contract = clean(body.contract, 300)
  const orderDate = clean(body.orderDate, 40)

  if (!name || !EMAIL_RE.test(email) || !contract) {
    return NextResponse.json(
      { error: 'Completează numele, e-mailul și comanda sau produsul.' },
      { status: 400 }
    )
  }

  const session = await auth().catch(() => null)
  const accountEmail = (session?.user as { email?: string } | undefined)?.email

  const receivedAt = new Date()
  const when = receivedAt.toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    dateStyle: 'long',
    timeStyle: 'medium',
  })

  const statement = [
    'Declarație de retragere din contract',
    '',
    `Prin prezenta, mă retrag din contractul privind: ${contract}`,
    orderDate ? `Data comenzii: ${orderDate}` : null,
    `Nume: ${name}`,
    `E-mail pentru confirmare: ${email}`,
    `Primită pe: ${when} (ora României)`,
  ]
    .filter(Boolean)
    .join('\n')

  const from = process.env.RESEND_FROM_EMAIL || 'noreply@perspectivaevei.com'
  let resend: Resend

  try {
    resend = new Resend(process.env.RESEND_API_KEY)
    const toTrader = await resend.emails.send({
      from,
      to: TRADER_EMAIL,
      replyTo: email,
      subject: `Retragere din contract: ${name}`,
      text:
        statement +
        (accountEmail ? `\nCont pe platformă: ${accountEmail}` : '\nTrimisă fără autentificare în cont.') +
        '\n\nTrimisă prin funcția „Retrage-te din contract aici” de pe app.perspectivaevei.com.' +
        '\nRăspunde clientului și, dacă retragerea este valabilă, rambursează plata în cel mult 14 zile de la primire.',
    })
    if (toTrader.error) throw new Error(toTrader.error.message)
  } catch (error) {
    console.error('Withdrawal statement could not be delivered:', error)
    return NextResponse.json(
      {
        error:
          'Nu am putut trimite declarația. Încearcă din nou sau scrie-ne la estedespremine@gmail.com.',
      },
      { status: 502 }
    )
  }

  let ackSent = true
  try {
    const ack = await resend.emails.send({
      from,
      to: email,
      replyTo: TRADER_EMAIL,
      subject: 'Am primit declarația ta de retragere',
      text: [
        `Bună, ${name},`,
        '',
        `Am primit declarația ta de retragere din contract pe ${when} (ora României). Iată conținutul ei:`,
        '',
        statement,
        '',
        'Verificăm comanda și îți răspundem pe e-mail. Dacă retragerea este valabilă, îți rambursăm plata în cel mult 14 zile de la primirea declarației, prin aceeași metodă de plată, conform Termenilor și condițiilor: https://www.perspectivaevei.com/termeni-si-conditii',
        '',
        'Cu drag,',
        'Eva',
        '',
        'DECOR-IUTA S.R.L. · Str. Poștei nr. 30, Ploiești, jud. Prahova · CUI 45280156 · estedespremine@gmail.com',
      ].join('\n'),
    })
    if (ack.error) throw new Error(ack.error.message)
  } catch (error) {
    ackSent = false
    console.error('Withdrawal acknowledgment could not be sent:', error)
  }

  return NextResponse.json({ receivedAt: receivedAt.toISOString(), when, ackSent }, { status: 201 })
}
