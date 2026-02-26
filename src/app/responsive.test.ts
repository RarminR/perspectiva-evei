import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

describe('Responsive Design', () => {
  it('Navbar has md:hidden class for hamburger button', () => {
    const content = readFileSync('src/components/ui/Navbar.tsx', 'utf-8')
    expect(content).toContain('md:hidden')
  })

  it('Navbar has hidden md:flex for desktop nav', () => {
    const content = readFileSync('src/components/ui/Navbar.tsx', 'utf-8')
    expect(content).toContain('hidden md:flex')
  })

  it('AdminSidebar has mobile transform classes', () => {
    const content = readFileSync('src/app/admin/components/AdminSidebar.tsx', 'utf-8')
    expect(content).toContain('translate-x-0')
    expect(content).toContain('-translate-x-full')
  })

  it('Homepage has responsive grid classes', () => {
    const content = readFileSync('src/app/page.tsx', 'utf-8')
    expect(content).toMatch(/grid-cols-1|sm:grid-cols|md:grid-cols/)
  })

  it('Admin layout has mobile sidebar toggle', () => {
    const content = readFileSync('src/app/admin/components/AdminLayoutClient.tsx', 'utf-8')
    expect(content).toMatch(/md:hidden|sidebarOpen|hamburger/i)
  })

  it('Course page has responsive layout', () => {
    const content = readFileSync('src/app/cursul-ado/page.tsx', 'utf-8')
    expect(content).toMatch(/sm:|md:|lg:/)
  })

  it('AdminSidebar has overlay for mobile', () => {
    const content = readFileSync('src/app/admin/components/AdminSidebar.tsx', 'utf-8')
    expect(content).toContain('md:hidden')
    expect(content).toMatch(/bg-black\/50|overlay|inset-0/)
  })

  it('Guides page has responsive grid', () => {
    const content = readFileSync('src/app/ghiduri/page.tsx', 'utf-8')
    expect(content).toMatch(/grid-cols-1.*md:grid-cols/)
  })
})
