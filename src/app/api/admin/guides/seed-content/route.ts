import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const GUIDE_CONTENT: Record<string, object> = {
  'cine-manifesta': {
    subtitle: 'Ghid despre identitate',
    aboutText:
      '\u201eCine manifest\u0103?!\u201d este un ghid despre identitate, nu despre metode.\n\nNu \u00ee\u021bi ofer\u0103 tehnici, afirma\u021bii sau exerci\u021bii de repetat zilnic. \u00ce\u021bi ofer\u0103 o \u00een\u021belegere clar\u0103 a identit\u0103\u021bii care manifest\u0103 fiecare experien\u021b\u0103 a vie\u021bii tale. Este creat pentru persoanele care aplic\u0103 constant diverse practici, dar simt c\u0103 rezultatele \u00eent\u00e2rzie sau c\u0103 \u201e\u0219tiu ce au de f\u0103cut\u201d, f\u0103r\u0103 ca ceva s\u0103 se schimbe cu adev\u0103rat. Ghidul te conduce c\u0103tre un singur punct esen\u021bial:\n\nNu tehnicile manifest\u0103, ci identitatea din care tr\u0103ie\u0219ti.',
    quote: 'Tehnici? Afirma\u021bii? Medita\u021bii? Nu. Manifestarea \u00eencepe din identitate.',
    features: [
      {
        title: 'Claritate, nu metode',
        description:
          'Acest ghid nu te \u00eenv\u0103\u021b\u0103 ce s\u0103 faci, ci te ajut\u0103 s\u0103 recuno\u0219ti cine e\u0219ti atunci c\u00e2nd \u00eencerci s\u0103 faci. Este un material de con\u0219tientizare care \u00ee\u021bi schimb\u0103 punctul din care prive\u0219ti manifestarea, f\u0103r\u0103 pa\u0219i, tehnici sau ritualuri.',
      },
    ],
    highlights: ['\u00ce\u021bi doresc mult succes!'],
  },
  'este-despre-mine': {
    subtitle: 'Ghid de schimbare al credin\u021belor',
    aboutText:
      'Am conceput acest material pentru a te ajuta s\u0103 \u00een\u021belegi, at\u00e2t practic, c\u00e2t \u0219i teoretic, c\u0103 tot ceea ce tr\u0103ie\u0219ti \u00een momentul de fa\u021b\u0103 nu este dec\u00e2t povestea pe care \u021bi-o spui constant despre tine la nivel subcon\u0219tient.',
    quote: 'Astfel, am dezvoltat acest ghid pentru \u00eencep\u0103tori, format din dou\u0103 p\u0103r\u021bi:',
    badges: ['Ghid pentru \u00eencep\u0103tori'],
    features: [
      {
        title: 'Partea I - Teorie',
        description: 'Teorie \u0219i \u00eendrum\u0103ri pentru a schimba convingerile toxice despre tine',
      },
      {
        title: 'Partea II - Practic\u0103',
        description:
          'Parte practic\u0103, ce func\u021bioneaz\u0103 ca un jurnal pentru ca tot procesul de reprogramare al subcon\u0219tientului t\u0103u s\u0103 fie mai u\u0219or',
      },
    ],
    highlights: ['\u00ce\u021bi doresc mult succes!'],
  },
  'este-tot-despre-mine': {
    subtitle: 'Ghid de manifestare al persoanei specifice',
    aboutText:
      'Ghidul de manifestare SP este un concept nou, dar de mare ajutor, menit s\u0103 te \u00eendrume pe tine s\u0103 dizolvi barierele min\u021bii tale cu privire la rela\u021biile din via\u021ba ta, \u0219i mai ales, la rela\u021bia ta de cuplu. De\u021bii controlul permanent, iar con\u021binutul acestui produs te va convinge de asta.',
    quote: 'Nu c\u0103uta calea u\u0219oar\u0103 pentru a atrage iubirea, ci alege calea fireasc\u0103 \u0219i natural\u0103 a Adev\u0103rului.',
    features: [
      {
        title: 'Teorie + Practic\u0103',
        description:
          'Acest material con\u021bine partea teoretic\u0103 despre cum func\u021bioneaz\u0103 realitatea din punct de vedere metafizic, \u0219i partea practic\u0103 de care tu s\u0103 te po\u021bi folosi de acum \u00eencolo pentru a crea \u0219i tr\u0103i ce-\u021bi dore\u0219ti',
      },
    ],
    highlights: ['\u00ce\u021bi doresc mult succes!'],
  },
}

export async function POST(_req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  for (const [slug, content] of Object.entries(GUIDE_CONTENT)) {
    const guide = await prisma.guide.findUnique({ where: { slug } })
    if (!guide) {
      results.push(`${slug}: not found`)
      continue
    }

    // Merge with existing contentJson
    const existing = (guide.contentJson as object) || {}
    const merged = { ...existing, ...content }

    await prisma.guide.update({
      where: { slug },
      data: { contentJson: merged },
    })
    results.push(`${slug}: updated`)
  }

  return NextResponse.json({ results })
}
