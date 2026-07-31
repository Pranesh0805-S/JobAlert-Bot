export default function Tabs({ active, onChange }) {
  const tabs = [
    { id: "search", label: "🔍 Search Jobs" },
    { id: "parser", label: "📋 Paste WhatsApp Message" },
  ];

  return (
    <div className="inline-flex bg-panel/60 border border-white/10 rounded-full p-1 gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            active === t.id
              ? "bg-accent text-ink"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
