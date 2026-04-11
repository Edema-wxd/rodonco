export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-8 max-w-sm w-full">

        {/* Logo — replace src with your logo file in /public */}
        <img
          src="/logo.svg"
          alt="logo"
          width={96}
          height={96}
          className="w-24 h-24 object-contain"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black leading-none">
            Coming Soon
          </h1>
          <p className="text-base sm:text-lg text-black/60 tracking-wide">
            We are cooking for you.
          </p>
        </div>

      </div>
    </main>
  );
}
