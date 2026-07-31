const features = [
  {
    icon: "🧠",
    title: "Real extraction, not keyword search",
    desc: "Company, role, location, salary and deadline are pulled out even from messy, emoji-heavy, unlabeled posts.",
  },
  {
    icon: "🎯",
    title: "Relevance scoring",
    desc: "Every post is compared against what you said you're interested in — using semantic similarity, not exact-word matching.",
  },
  {
    icon: "🔁",
    title: "Duplicate detection",
    desc: "The same opening reworded across five channels is recognized as one post, not five separate alerts.",
  },
  {
    icon: "🔒",
    title: "Privacy-first by design",
    desc: "Your number is stored as a one-way hash. The bot never reads channels you follow — only what you forward it.",
  },
];

export default function Features() {
  return (
    <section className="py-24 px-6 bg-panel/40">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 max-w-xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Built with real infrastructure
          </h2>
          <p className="text-slate-400">
            Not a script — a full pipeline: WhatsApp Business API, an NLP extraction service,
            and a vector database for matching and deduplication.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="glow-card rounded-2xl p-6 flex gap-4 items-start hover:border-accent/30 transition-colors"
            >
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-display font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
