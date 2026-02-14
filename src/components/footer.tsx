export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-2xl mx-auto text-center">
          Indian Startup Jobs Board aggregates tech, engineering, product, and business roles from VC-backed startups across Bangalore, Mumbai, Delhi, and other Indian cities. Discover career opportunities at companies funded by leading venture capital firms.
        </p>
        <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
          Brewed with the help of Opus 4.6 and{" "}
          <a
            href="https://buymeacoffee.com/phequals7"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            @pHequals7
          </a>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground/60">
          Data sourced from public VC portfolio job boards.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> &middot; </span>
          Not affiliated with any VC fund.
        </p>
      </div>
    </footer>
  );
}
