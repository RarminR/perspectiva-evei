import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const credentials = [
  {
    title: 'Coach de manifestare conștientă',
    description: 'Specializare în tehnici de schimbare a convingerilor și manifestare bazată pe identitate.',
    icon: '✦',
  },
  {
    title: '4+ ani de experiență',
    description: 'Peste 1000 de ore de coaching individual și de grup cu rezultate transformatoare.',
    icon: '◈',
  },
  {
    title: 'Cursul A.D.O. — 10 ediții',
    description: 'Peste 100 de cursanți care au trecut prin programul de 8 săptămâni.',
    icon: '❋',
  },
  {
    title: 'Autoare de ghiduri',
    description: 'Ghiduri digitale pentru identitate, credințe și manifestarea persoanei specifice.',
    icon: '✧',
  },
]

export default function DespreMine() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="relative bg-[#2D1B69] text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E91E8C]/10 via-transparent to-[#C4956A]/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="pink" className="mb-6">Despre mine</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#E91E8C] to-[#FDA4AF] bg-clip-text text-transparent">
              Eva Popescu
            </span>
          </h1>
          <p className="text-white/80 text-xl">
            Coach de manifestare și conștiință
          </p>
        </div>
      </section>

      {/* Story Section */}
      <Section variant="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#2D1B69] mb-8">Povestea mea</h2>

          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>
              Am început această călătorie din dorința de a înțelege cu adevărat cum funcționează realitatea
              pe care o trăim. După ani de căutări, am descoperit că totul începe cu identitatea noastră —
              cu povestea pe care ne-o spunem despre noi înșine.
            </p>
            <p>
              Manifestarea conștientă nu este despre tehnici, afirmații sau meditații. Este despre a
              înțelege cine ești cu adevărat și a alege conștient experiența pe care vrei să o trăiești.
              Aceasta este esența muncii mele.
            </p>
            <p>
              Am creat <strong>Cursul A.D.O. (Alege! Decide! Observă!)</strong> pentru a oferi un cadru
              practic și profund celor care sunt gata să preia controlul asupra vieții lor. Fiecare ediție
              este limitată la maximum 15 participanți, pentru a asigura îndrumare personalizată.
            </p>
            <p>
              Ghidurile mele — <em>&ldquo;Cine Manifestă?!&rdquo;</em>, <em>&ldquo;Este despre mine!&rdquo;</em>
              și <em>&ldquo;Este (tot) despre mine!&rdquo;</em> — sunt instrumente create pentru a te ajuta
              să faci primii pași spre o viață trăită conștient.
            </p>
          </div>
        </div>
      </Section>

      {/* Mission */}
      <Section variant="light-pink">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#2D1B69] mb-6">Misiunea mea</h2>
          <p className="text-gray-700 text-xl leading-relaxed">
            Să te ghidez pentru a înțelege corect manifestarea conștientă, astfel încât tu să alegi
            conștient o experiență autentică. E timpul să preiei controlul și să-ți reamintești cine
            ești cu adevărat: <strong className="text-[#E91E8C]">Creatorul realității tale.</strong>
          </p>
        </div>
      </Section>

      {/* Credentials */}
      <Section variant="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2D1B69] mb-4">Experiență și certificări</h2>
          <p className="text-gray-600 text-lg">Ce aduc în munca mea cu tine</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {credentials.map((c) => (
            <Card key={c.title} className="group hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <span className="text-2xl text-[#E91E8C] shrink-0 mt-1">{c.icon}</span>
                <div>
                  <h3 className="text-[#2D1B69] font-semibold text-lg mb-1">{c.title}</h3>
                  <p className="text-gray-600 text-sm">{c.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="desert">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-[#2D1B69] mb-4">
            Hai să lucrăm împreună
          </h2>
          <p className="text-gray-700 text-lg mb-8 max-w-xl mx-auto">
            Fie că alegi cursul, un ghid sau o ședință individuală, sunt aici pentru tine.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/cursul-ado"
              className="inline-flex items-center gap-2 bg-[#E91E8C] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#E91E8C]/90 transition-all hover:shadow-lg hover:shadow-[#E91E8C]/25"
            >
              Cursul A.D.O.
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-[#2D1B69] text-[#2D1B69] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#2D1B69] hover:text-white transition-all"
            >
              Contactează-mă
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  )
}
