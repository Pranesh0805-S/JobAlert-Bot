const WHATSAPP_LINK = "https://wa.me/15551855354?text=Hi";

export default function CTA() {
  return (
    <section id="chat" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-violet/10 via-transparent to-transparent" />
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Stop scrolling. Start forwarding.
        </h2>
        <p className="text-slate-400 mb-10">
          Open WhatsApp, say hi, and forward your first job post. Takes under a minute.
        </p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accentDim transition-colors text-ink font-semibold px-8 py-4 rounded-full text-lg shadow-[0_15px_40px_-10px_rgba(37,211,102,0.6)]"
        >
          Chat on WhatsApp →
        </a>
        <p className="text-xs text-slate-500 mt-4">
          Opens WhatsApp on mobile or WhatsApp Web on desktop
        </p>
      </div>
    </section>
  );
}
