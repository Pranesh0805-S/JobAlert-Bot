import { useState } from "react";
import Navbar from "../components/shared/Navbar.jsx";
import Footer from "../components/shared/Footer.jsx";
import Tabs from "../components/jobfinder/Tabs.jsx";
import SearchForm from "../components/jobfinder/SearchForm.jsx";
import SearchResults from "../components/jobfinder/SearchResults.jsx";
import ParserForm from "../components/jobfinder/ParserForm.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { runJobSearch } from "../services/searchService.js";
import { parseWhatsAppMessage } from "../services/parserService.js";

export default function JobFinderPage() {
  const [mode, setMode] = useState("search");
  const search = useAsync(runJobSearch);
  const parse = useAsync(parseWhatsAppMessage);

  return (
    <div className="min-h-screen bg-ink text-slate-100 font-body">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 text-white">
              Job Finder
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Free, no login required. Search stored job posts, or paste any WhatsApp job
              message to extract the details instantly — same engine as the bot.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Tabs active={mode} onChange={setMode} />
          </div>

          {mode === "search" ? (
            <>
              <SearchForm onSearch={search.run} loading={search.status === "loading"} />
              <SearchResults status={search.status} data={search.data} error={search.error} />
            </>
          ) : (
            <ParserForm
              onExtract={parse.run}
              status={parse.status}
              data={parse.data}
              error={parse.error}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
