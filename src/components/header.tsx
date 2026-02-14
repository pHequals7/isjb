export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 text-center">
        <div className="inline-flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/isjb.svg"
            alt="ISJB logo"
            className="h-16 w-auto sm:h-20"
          />
          <h1 className="text-left text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Indian Startup Jobs Board
          </h1>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/60 sm:text-lg">
          Curated job openings from portfolio companies of India&apos;s top
          venture capital firms — all in one place.
        </p>
      </div>
    </header>
  );
}
