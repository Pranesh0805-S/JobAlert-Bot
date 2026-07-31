import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const onLanding = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-ink">
            J
          </div>
          <span className="font-display font-bold text-lg">JobAlert Bot</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/job-finder"
            className="text-sm font-medium px-4 py-2 rounded-full border border-white/15 hover:border-accent/40 hover:text-accent transition-colors"
          >
            Job Finder
          </Link>
          <a
            href={onLanding ? "#chat" : "https://wa.me/15551855354?text=Hi"}
            target={onLanding ? undefined : "_blank"}
            rel={onLanding ? undefined : "noopener noreferrer"}
            className="text-sm font-medium px-4 py-2 rounded-full bg-accent text-ink hover:bg-accentDim transition-colors"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}
