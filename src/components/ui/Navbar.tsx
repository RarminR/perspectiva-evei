'use client'
import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'

const BASE_NAV_LINKS = [
  { href: '/cursul-ado', enrolledHref: '/curs/cursul-ado', courseSlug: 'cursul-ado', label: 'Cursul A.D.O.' },
  { href: '/ghiduri', label: 'Ghiduri' },
  { href: '/sedinte-1-la-1', label: 'Ședințe 1:1' },
  { href: 'https://www.perspectivaevei.com/', label: 'Despre Eva' },

]

export function Navbar() {
  const { data: session } = useSession()
  const user = session?.user
  const [mobileOpen, setMobileOpen] = useState(false)
  const [enrolledSlugs, setEnrolledSlugs] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    fetch('/api/me/enrollments')
      .then((r) => r.json())
      .then((data) => setEnrolledSlugs(data.courseSlugs || []))
      .catch(() => {})
  }, [user])

  const navLinks = useMemo(
    () =>
      BASE_NAV_LINKS.map((link) => {
        if (link.courseSlug && link.enrolledHref && enrolledSlugs.includes(link.courseSlug)) {
          return { href: link.enrolledHref, label: link.label }
        }
        return { href: link.href, label: link.label }
      }),
    [enrolledSlugs]
  )

  return (
    <nav
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(#51087ee6, #a007dce6)',
        borderBottom: '1px solid #21252940',
        alignItems: 'center',
        width: '100%',
        minHeight: '4.5rem',
        paddingLeft: '5%',
        paddingRight: '5%',
        display: 'flex',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 0 10px #a007dc40',
      }}
    >
      <div style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        display: 'flex',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/logo-light.svg"
            alt="Perspectiva Evei"
            width={136}
            height={32}
            priority
            style={{ width: '8.5rem', height: 'auto' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex"
          style={{
            gap: '5px',
            color: 'white',
            alignItems: 'center',
            display: 'flex',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: 'white',
                backgroundColor: 'transparent',
                borderRadius: '200px',
                padding: '10px 16px',
                transition: 'all .2s',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
          {user ? (
            <>
              <Link
                href="/dashboard"
                style={{
                  color: '#f8f9fa',
                  backgroundColor: '#51087e',
                  border: '1px solid #51087e',
                  borderRadius: '999px',
                  padding: '.5rem 1.25rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all .2s',
                }}
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  color: 'white',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '999px',
                  padding: '.5rem 1.25rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              >
                Deloghează-te
              </button>
            </>
          ) : (
            <>
              <Link
                href="/logare"
                style={{
                  color: 'white',
                  backgroundColor: 'transparent',
                  border: '1px solid white',
                  borderRadius: '999px',
                  padding: '.75rem 1.5rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#51087e' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'white' }}
              >
                Logare
              </Link>
              <Link
                href="/inregistrare"
                style={{
                  color: '#51087e',
                  backgroundColor: 'white',
                  border: '1px solid white',
                  borderRadius: '999px',
                  padding: '.75rem 1.5rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'inset 0 0 0 500px rgba(81,8,126,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                Înregistrare
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Meniu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '24px' }}>
            <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '2px', transition: 'all .3s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '2px', transition: 'all .3s', opacity: mobileOpen ? 0 : 1 }} />
            <div style={{ height: '2px', backgroundColor: 'white', borderRadius: '2px', transition: 'all .3s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </div>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            top: '4.5rem',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(#51087ef5, #a007dcf5)',
            backdropFilter: 'blur(10px)',
            padding: '2rem 5%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            zIndex: 39,
          }}
        >
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo-stacked.svg" alt="Perspectiva Evei" width={80} height={80} />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: 'white',
                backgroundColor: 'transparent',
                borderRadius: '200px',
                padding: '10px 20px',
                textDecoration: 'none',
                fontSize: '1rem',
                transition: 'all .2s',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: '#51087e',
                    backgroundColor: 'white',
                    border: '1px solid white',
                    borderRadius: '999px',
                    padding: '.75rem 1.5rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }) }}
                  style={{
                    color: 'white',
                    backgroundColor: 'transparent',
                    border: '1px solid white',
                    borderRadius: '999px',
                    padding: '.75rem 1.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '1rem',
                  }}
                >
                  Deloghează-te
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/logare"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: 'white',
                    backgroundColor: 'transparent',
                    border: '1px solid white',
                    borderRadius: '999px',
                    padding: '.75rem 1.5rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  Logare
                </Link>
                <Link
                  href="/inregistrare"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: '#51087e',
                    backgroundColor: 'white',
                    border: '1px solid white',
                    borderRadius: '999px',
                    padding: '.75rem 1.5rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
