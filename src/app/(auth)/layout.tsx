import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-3 bg-black">

      {/* LEFT SIDE */}
      <div className="relative hidden lg:col-span-2 lg:block">

        <Image
          src="/login-bg.png"
          alt="Login background"
          fill
          priority
          className="object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Text Overlay */}
        <div className="relative z-10 flex flex-col h-full justify-between p-10 text-white">

          <div className="text-xl font-semibold">
            CEi Voice
          </div>

          <p className="max-w-md text-lg text-zinc-300">
            Streamlining support communication through
            intelligent voice integration.
          </p>

        </div>
      </div>


      {/* RIGHT SIDE - FULL BLACK */}
      <div className="
        flex items-center justify-center
        px-6
        bg-black
        text-white
      ">

        {/* Solid Black Card */}
        <div className="
          w-full max-w-sm
          rounded-2xl
          bg-black
          shadow-2xl
          p-8
        ">

          {children}

        </div>
      </div>

    </div>
  );
}