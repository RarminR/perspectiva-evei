'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MessageThread } from './MessageThread'

type Tab = 'principal' | 'oferte' | 'calendar' | 'mesaje'

interface Enrollment {
  id: string
  accessExpiresAt: string
  edition: {
    editionNumber: number
    course: { title: string; slug: string }
  }
}

interface Guide {
  id: string
  title: string
  slug: string
  coverImage: string | null
}

interface Session {
  id: string
  scheduledAt: string
  duration: number
  status: string
  zoomLink: string | null
}

interface Offer {
  id: string
  title: string
  description: string | null
  linkUrl: string | null
  linkLabel: string | null
  validUntil: string | null
}

interface DashboardTabsProps {
  enrollments: Enrollment[]
  guides: Guide[]
  upcomingSessions: Session[]
  offers: Offer[]
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'principal', label: 'Pagina Principală', icon: '🏠' },
  { id: 'oferte', label: 'Oferte Personalizate', icon: '🎁' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'mesaje', label: 'Mesaje cu Eva', icon: '💬' },
]

const sectionStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  boxShadow: '0 4px 20px rgba(81,8,126,0.08)',
}

const sectionHeadingStyle: React.CSSProperties = {
  color: '#51087e',
  fontSize: '1.1rem',
  fontWeight: 700,
  marginBottom: '1rem',
}

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(81,8,126,0.06)',
  borderRadius: '12px',
  marginBottom: '0.5rem',
}

const emptyTextStyle: React.CSSProperties = {
  color: '#666',
  marginBottom: '0.5rem',
}

const ctaLinkStyle: React.CSSProperties = {
  color: '#a007dc',
  fontWeight: 600,
  fontSize: '0.9rem',
  textDecoration: 'none',
}

export function DashboardTabs({ enrollments, guides, upcomingSessions, offers }: DashboardTabsProps) {
  const [active, setActive] = useState<Tab>('principal')
  const now = new Date()

  return (
    <>
      {/* Tab Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(81,8,126,0.1)',
        padding: '0 5%',
        display: 'flex',
        justifyContent: 'center',
        position: 'sticky',
        top: '4.5rem',
        zIndex: 30,
        boxShadow: '0 2px 8px rgba(81,8,126,0.06)',
      }}>
        <div style={{
          maxWidth: '940px',
          width: '100%',
          display: 'flex',
          gap: '0',
          overflowX: 'auto',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                flex: 1,
                padding: '14px 12px',
                border: 'none',
                borderBottom: active === tab.id ? '3px solid #51087e' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: active === tab.id ? '#51087e' : '#888',
                fontWeight: active === tab.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <section style={{
        backgroundImage: 'linear-gradient(180deg, white, #e8c2ff)',
        padding: '40px 5%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{ maxWidth: '940px', width: '100%' }}>

          {/* TAB: Pagina Principală */}
          {active === 'principal' && (
            <>
              {/* Courses */}
              <div style={sectionStyle}>
                <h2 style={sectionHeadingStyle}>Cursurile mele</h2>
                {enrollments.length === 0 ? (
                  <div>
                    <p style={emptyTextStyle}>Nu ești înscris la niciun curs.</p>
                    <Link href="/cursul-ado" style={ctaLinkStyle}>
                      Descoperă Cursul A.D.O. →
                    </Link>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {enrollments.map((e) => {
                      const isExpired = new Date(e.accessExpiresAt) < now
                      return (
                        <li key={e.id} style={listItemStyle}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                              <p style={{ fontWeight: 600, color: '#51087e', margin: 0 }}>
                                {e.edition.course.title}
                              </p>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                                color: isExpired ? '#dc2626' : '#16a34a',
                              }}>
                                {isExpired ? 'Expirat' : 'Activ'}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                              Ediția {e.edition.editionNumber} · Acces până la{' '}
                              {new Date(e.accessExpiresAt).toLocaleDateString('ro-RO')}
                            </p>
                          </div>
                          <Link href={`/curs/${e.edition.course.slug}`} style={ctaLinkStyle}>
                            Accesează →
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Guides */}
              <div style={sectionStyle}>
                <h2 style={sectionHeadingStyle}>Ghidurile mele</h2>
                {guides.length === 0 ? (
                  <div>
                    <p style={emptyTextStyle}>Nu ai achiziționat niciun ghid.</p>
                    <Link href="/ghiduri" style={ctaLinkStyle}>
                      Explorează ghidurile →
                    </Link>
                  </div>
                ) : (
                  <div
                    style={{ display: 'grid', gap: '16px' }}
                    className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {guides.map((guide) => (
                      <div
                        key={guide.id}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(81,8,126,0.08)',
                        }}
                      >
                        {guide.coverImage && (
                          <Image
                            src={guide.coverImage}
                            alt={guide.title}
                            width={400}
                            height={160}
                            unoptimized
                            style={{
                              width: '100%',
                              height: '160px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        )}
                        <div style={{ padding: '1rem' }}>
                          <p style={{ fontWeight: 600, color: '#2c0246', margin: '0 0 0.5rem' }}>
                            {guide.title}
                          </p>
                          <Link href={`/ghidurile-mele/${guide.slug}`} style={ctaLinkStyle}>
                            Citește →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: Oferte Personalizate */}
          {active === 'oferte' && (
            <div style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Oferte personalizate</h2>
              {offers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#999',
                }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🎁</p>
                  <p style={{ margin: 0 }}>Nu ai oferte personalizate momentan.</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                    Eva îți va trimite oferte speciale aici.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'rgba(81,8,126,0.06)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, color: '#51087e', margin: '0 0 0.2rem', fontSize: '1.05rem' }}>
                          {offer.title}
                        </p>
                        {offer.description && (
                          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, lineHeight: 1.5 }}>
                            {offer.description}
                          </p>
                        )}
                        {offer.validUntil && (
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: '6px 0 0' }}>
                            Valabil până la {new Date(offer.validUntil).toLocaleDateString('ro-RO')}
                          </p>
                        )}
                      </div>
                      {offer.linkUrl && (
                        <Link
                          href={offer.linkUrl}
                          style={{
                            backgroundColor: '#51087e',
                            color: '#ffffff',
                            padding: '0.6rem 1.3rem',
                            borderRadius: '999px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {offer.linkLabel || 'Vezi oferta →'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Calendar */}
          {active === 'calendar' && (
            <div style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Ședințele mele 1:1</h2>
              {upcomingSessions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#999',
                }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📅</p>
                  <p style={{ margin: '0 0 0.75rem' }}>Nu ai ședințe programate.</p>
                  <Link
                    href="/sedinte-1-la-1"
                    style={{
                      backgroundColor: '#51087e',
                      color: '#ffffff',
                      padding: '0.6rem 1.3rem',
                      borderRadius: '999px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Programează o sesiune →
                  </Link>
                </div>
              ) : (
                <>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {upcomingSessions.map((s) => {
                      const date = new Date(s.scheduledAt)
                      return (
                        <li key={s.id} style={listItemStyle}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#51087e', margin: '0 0 0.2rem' }}>
                              {date.toLocaleDateString('ro-RO', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                              {date.toLocaleTimeString('ro-RO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              · {s.duration} minute
                            </p>
                          </div>
                          {s.zoomLink ? (
                            <a
                              href={s.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={ctaLinkStyle}
                            >
                              Deschide Zoom →
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#999' }}>
                              Link-ul va fi trimis pe email
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link href="/sedinte-1-la-1" style={ctaLinkStyle}>
                      Programează o sesiune nouă →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: Mesaje cu Eva */}
          {active === 'mesaje' && (
            <div style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Mesaje cu Eva</h2>
              <MessageThread />
            </div>
          )}

        </div>
      </section>
    </>
  )
}
