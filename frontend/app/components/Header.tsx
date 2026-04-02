export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-[1800px] mx-auto flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <h1 className="text-xl font-bold tracking-tighter">
            CRYPTO <span className="font-light text-neutral-400">DASHBOARD</span>
          </h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <div className="text-sm px-3 py-1 rounded-full bg-card border border-border text-neutral-400">
            Market: <span className="text-success font-medium">Open</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
