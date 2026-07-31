import { formatDate } from "../../utils/format.js";

// A single job result, shared by both Search Jobs and Paste & Extract modes,
// so the two features never render results differently.
export default function JobCard({ job, duplicateOf, matchScore }) {
  const deadline = formatDate(job.deadline);

  return (
    <div className="glow-card rounded-2xl p-5 hover:border-accent/30 transition-colors">
      {duplicateOf && (
        <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-full px-3 py-1">
          👀 Already seen — similar to {duplicateOf.company || "a previous post"}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-semibold text-lg leading-tight">
            {job.role || "Role not specified"}
          </h3>
          <p className="text-accent text-sm font-medium mt-0.5">
            {job.company || "Company not specified"}
          </p>
        </div>
        {typeof matchScore === "number" && (
          <span className="shrink-0 text-xs font-semibold bg-violet/15 text-violet border border-violet/30 rounded-full px-2.5 py-1">
            {Math.round(matchScore * 100)}% match
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-400 mb-3">
        {job.location && <span>📍 {job.location}</span>}
        {job.salary && <span>💰 {job.salary}</span>}
        {deadline && <span>⏰ {deadline}</span>}
      </div>

      {/* Fields not yet captured by the extraction pipeline - shown as
          "coming soon" placeholders rather than faked data, per the
          project's future-scalability plan. */}
      <div className="flex flex-wrap gap-2 mb-3">
        {["Experience", "Skills", "Job Type"].map((label) => (
          <span
            key={label}
            className="text-[11px] text-slate-500 border border-white/10 rounded-full px-2.5 py-1"
            title="Not yet extracted - planned for a future version"
          >
            {label}: coming soon
          </span>
        ))}
      </div>

      {job.application_link && (
        <a
          href={job.application_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink bg-accent hover:bg-accentDim transition-colors rounded-full px-4 py-2 mt-1"
        >
          Apply →
        </a>
      )}
    </div>
  );
}
