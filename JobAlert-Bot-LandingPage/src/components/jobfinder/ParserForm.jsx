import { useState } from "react";
import JobCard from "./JobCard.jsx";

export default function ParserForm({ onExtract, status, data, error }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onExtract(text);
  }

  return (
    <div className="glow-card rounded-2xl p-6">
      <form onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Paste the WhatsApp job message
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={`TCS Hiring\n\nRole: Software Engineer\nLocation: Chennai\nSalary: 5 LPA\nApply: https://...`}
          className="w-full bg-[#0f1830] border border-white/10 focus:border-accent/50 rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-500 resize-y"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-4 bg-accent hover:bg-accentDim disabled:opacity-60 transition-colors text-ink font-semibold px-8 py-2.5 rounded-full"
        >
          {status === "loading" ? "Extracting…" : "Extract Job"}
        </button>
      </form>

      <div className="mt-6">
        {status === "loading" && (
          <p className="text-center text-slate-400 text-sm py-6">
            Extracting — the server may take a few seconds to wake up on first use…
          </p>
        )}

        {status === "error" && (
          <p className="text-center text-red-400 text-sm py-6">{error}</p>
        )}

        {status === "success" && data?.status === "unrecognized" && (
          <p className="text-center text-slate-400 text-sm py-6">{data.message}</p>
        )}

        {status === "success" && data?.status === "duplicate" && (
          <JobCard job={data.extracted} duplicateOf={data.duplicate} />
        )}

        {status === "success" && data?.status === "new" && (
          <JobCard job={data.extracted} />
        )}
      </div>
    </div>
  );
}
