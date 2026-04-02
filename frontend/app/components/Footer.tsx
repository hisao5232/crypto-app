export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
        <p>&copy; 2026 Crypto Dashboard Pro. All rights reserved.</p>
        <p>
          Powered by <a href="https://go-pro-world.net" className="text-neutral-500 hover:text-primary transition-colors">go-pro-world.net</a>
        </p>
      </div>
    </footer>
  );
}
