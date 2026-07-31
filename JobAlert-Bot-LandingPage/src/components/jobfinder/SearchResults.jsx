import JobCard from "./JobCard.jsx";

export default function SearchResults({ status, data, error }) {
  if (status === "idle") {
    return (
      <p className="text-center text-slate-500 text-sm py-16">
        Enter a company, role, or location above to search stored job posts.
      </p>
    );
  }

  if (status === "loading") {
    return (
      <p className="text-center text-slate-400 text-sm py-16">
        Searching — the server may take a few seconds to wake up on first use…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-red-400 text-sm py-16">{error}</p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-slate-500 text-sm py-16">
        No matching jobs found yet. Try broader filters, or check back once more posts have been submitted.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-8">
      {data.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
