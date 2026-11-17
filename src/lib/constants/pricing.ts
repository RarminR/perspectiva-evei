export const SESSION_PRICING = {
  PRICE_EUR: 160,
  DURATION_MINUTES: 60,
  PRODUCT_NAME: 'Ședință 1:1 cu Eva',
} as const

export const COURSE_PRICING = {
  FULL_PRICE: '€1.188',
  FULL_PRICE_EUR: 1188,
  FULL_PRICE_CROSSED: '€1.288',
  INSTALLMENT_PRICE: '€644',
  INSTALLMENT_TOTAL: '€1.288',
  MAX_PARTICIPANTS: 15,
  SAVINGS_PERCENT: '7,76%',
} as const

/**
 * Reducere temporară la plata integrală a Cursului A.D.O.!
 * Black Friday 2026: −20%, joi 19 nov. 00:00 – duminică 22 nov. 23:59 (ora României).
 *
 * - `enabled`: afișează prețul redus pe /cursul-ado în intervalul de mai jos.
 * - `applyInCode`: true = checkout-ul aplică reducerea la prețul din baza de date
 *   (prețul cursului rămâne €1.188 în admin). false = prețul se schimbă manual în admin,
 *   iar codul doar îl afișează. Nu le folosiți pe amândouă: reducerea s-ar aplica de două ori.
 * - Plata în rate nu primește reducere.
 */
export const COURSE_PROMO = {
  enabled: true,
  applyInCode: false, // true doar dacă nu se mai schimbă prețul manual în admin (vezi mai sus)
  label: 'Black Friday',
  percentOff: 20,
  startsAt: '2026-11-19T00:00:00+02:00',
  endsAt: '2026-11-23T00:00:00+02:00', // exclusiv: oferta se încheie duminică la 23:59
  endsLabel: 'duminică, 22 noiembrie, la 23:59',
} as const

export const PRICING_FEATURES = [
  'Acces la întâlnirile live și la înregistrări',
  'Singurul curs de manifestare conștientă de care vei avea nevoie',
  'Garanția clarității',
] as const
