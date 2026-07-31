import { useState } from "react";

export default function SearchForm({ onSearch, loading }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ company, role, location });
  }

  const inputClass =
    "w-full bg-[#0f1830] border border-white/10 focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="glow-card rounded-2xl p-6">
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Company</label>
          <input
            className={inputClass}
            placeholder="e.g. TCS"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
          <input
            className={inputClass}
            placeholder="e.g. Software Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
          <input
            className={inputClass}
            placeholder="e.g. Chennai"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Placeholder filters for future scalability - disabled, not wired to
          the backend yet since experience/skills/job type aren't captured
          by the extraction pipeline today. */}
      <div className="grid sm:grid-cols-3 gap-4 mb-5 opacity-40">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Experience <span className="text-[10px]">(coming soon)</span>
          </label>
          <input disabled className={inputClass} placeholder="Not available yet" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Skills <span className="text-[10px]">(coming soon)</span>
          </label>
          <input disabled className={inputClass} placeholder="Not available yet" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Job Type <span className="text-[10px]">(coming soon)</span>
          </label>
          <select disabled className={inputClass}>
            <option>Not available yet</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-accent hover:bg-accentDim disabled:opacity-60 transition-colors text-ink font-semibold px-8 py-2.5 rounded-full"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
