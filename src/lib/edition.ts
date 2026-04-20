const MONTHS_RO = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
]

export function formatEditionRange(start: Date, end: Date): string {
  const s = new Date(start)
  const e = new Date(end)
  const sDay = s.getDate()
  const eDay = e.getDate()
  const sMonth = MONTHS_RO[s.getMonth()]
  const eMonth = MONTHS_RO[e.getMonth()]
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${sDay} - ${eDay} ${eMonth}`
  }
  return `${sDay} ${sMonth} - ${eDay} ${eMonth}`
}
