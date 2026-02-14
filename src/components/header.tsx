export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/50">
          India&apos;s VC-backed startup ecosystem
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Indian Startup Jobs Board
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-primary-foreground/60 sm:text-lg">
          Curated job openings from portfolio companies of India&apos;s top
          venture capital firms — all in one place.
        </p>
      </div>
    </header>
  );
}
