export function imgSrc(raw: string): string {
  if (raw.startsWith('/') || raw.startsWith('http')) return raw
  return `/${raw}`
}
