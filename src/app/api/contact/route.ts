import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Toate câmpurile sunt obligatorii.' },
        { status: 400 }
      )
    }

    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@perspectivaevei.com',
      to: 'estedespremine@gmail.com',
      subject: `Mesaj nou de la ${name}`,
      text: `Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'A apărut o eroare la trimiterea mesajului.' },
      { status: 500 }
    )
  }
}
