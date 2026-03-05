import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">OK</div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Plată confirmată!</h1>
        <p className="mb-8 text-gray-600">
          Comanda ta a fost procesată cu succes. Vei primi un email de confirmare in curand.
        </p>
        <Link
          href="/profilul-meu"
          className="inline-block rounded-lg bg-[#a007dc] px-8 py-3 font-semibold text-white transition hover:bg-[#a007dc]/90"
        >
          Accesează conținutul
        </Link>
      </div>
    </div>
  )
}
