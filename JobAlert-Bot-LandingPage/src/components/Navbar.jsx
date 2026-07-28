export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-ink">
            J
          </div>
          <span className="font-display font-bold text-lg">JobAlert Bot</span>
        </div>
        <a
          href="#chat"
          className="text-sm font-medium px-4 py-2 rounded-full bg-accent text-ink hover:bg-accentDim transition-colors"
        >
          Try it on WhatsApp
        </a>
      </div>
    </nav>
  );
}
