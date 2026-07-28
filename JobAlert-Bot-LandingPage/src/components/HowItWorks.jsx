const steps = [
  {
    n: "01",
    title: "Say hi",
    desc: "Message the bot on WhatsApp and tell it your field of interest — e.g. \"backend development, fintech\".",
  },
  {
    n: "02",
    title: "Forward a post",
    desc: "Forward any job listing you get on WhatsApp — messy formatting, emoji, screenshots of text, all fine.",
  },
  {
    n: "03",
    title: "Get a clean summary",
    desc: "The bot extracts company, role, location, salary, deadline and the application link automatically.",
  },
  {
    n: "04",
    title: "Skip the repeats",
    desc: "If it's the same post reworded from another channel, you're told instead of getting spammed again.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 max-w-xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-slate-400">
            Four steps, entirely inside a WhatsApp conversation you start yourself.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="glow-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="font-display text-3xl font-extrabold text-violet/70">{s.n}</span>
              <h3 className="font-display text-lg font-semibold mt-4 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
