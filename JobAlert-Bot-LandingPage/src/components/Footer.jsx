export default function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <span>© 2026 JobAlert Bot — a student-built project.</span>
        <div className="flex gap-6">
          <a href="/PRIVACY.md" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="https://github.com/Pranesh0805-S/JobAlert-Bot" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
