export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Data sourced from public VC portfolio job boards.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> &middot; </span>
          Not affiliated with any VC fund.
        </p>
      </div>
    </footer>
  );
}
