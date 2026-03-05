import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — hero image + logo overlay */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/images/poza-eva-hero.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay so logo reads well */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/40" />
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <Image
            src="/logo-light.svg"
            alt="Perspectiva Evei"
            width={200}
            height={62}
            className="drop-shadow-lg"
          />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 min-h-screen bg-gradient-to-br from-[#51087e] via-[#3d0660] to-[#2c0246] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#a007dc]/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 w-[450px] h-[450px] rounded-full bg-[#6b0ba8]/30 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/4 right-0 w-64 h-64 rounded-full bg-[#a007dc]/15 blur-[80px]" />

        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
