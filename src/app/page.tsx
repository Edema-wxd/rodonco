export default function Home() {
  return (
    <main className="relative min-h-screen bg-background flex items-center justify-center px-4 overflow-hidden">
      {/* Decorative background circle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center gap-10 max-w-md w-full">
        <img
          src="/logo.svg"
          alt="Rodo & Co"
          width={80}
          height={80}
          className="w-20 h-20 object-contain"
        />

        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-5xl sm:text-6xl italic leading-none tracking-tight text-foreground">
            Coming Soon
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We are cooking for you.
          </p>
        </div>

        <div className="h-px w-16 bg-border" />

        <p className="text-sm text-muted-foreground/70 tracking-wide uppercase">
          Rodo &amp; Co · Lagos
        </p>
      </div>
    </main>
  );
}
