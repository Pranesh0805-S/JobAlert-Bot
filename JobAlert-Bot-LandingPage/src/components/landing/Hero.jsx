import PhoneMockup from "./PhoneMockup.jsx";

const WHATSAPP_LINK = "https://wa.me/15551855354?text=Hi";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-fade pointer-events-none" />
      <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-block text-xs font-semibold tracking-wide uppercase text-violet bg-violet/10 border border-violet/30 rounded-full px-3 py-1 mb-5">
            Built on the official WhatsApp Business API
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6 text-white">
            Never miss a job post
            <span className="text-accent"> buried </span>
            in a WhatsApp channel again.
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-md">
            Forward any job listing to JobAlert Bot. It extracts the role, company, salary and
            deadline, checks it against what you're looking for, and skips posts you've already seen.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accentDim transition-colors text-ink font-semibold px-6 py-3 rounded-full shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)]"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 transition-colors px-6 py-3 rounded-full font-medium text-slate-200"
            >
              See how it works
            </a>
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.47 2.03 7.76L.5 31.5l7.94-2.08A15.44 15.44 0 0 0 16 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5Zm0 28.2a12.6 12.6 0 0 1-6.43-1.76l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.63 12.63 0 1 1 16 28.7Zm6.9-9.46c-.38-.19-2.24-1.1-2.58-1.23-.35-.13-.6-.19-.86.19-.25.38-.98 1.23-1.2 1.48-.22.25-.44.28-.82.1-.38-.19-1.6-.59-3.04-1.87-1.12-1-1.88-2.24-2.1-2.62-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.86-2.08-1.18-2.85-.31-.75-.63-.65-.86-.66h-.73c-.25 0-.66.1-1 .47-.35.38-1.32 1.29-1.32 3.14 0 1.85 1.35 3.64 1.54 3.89.19.25 2.66 4.06 6.45 5.7.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.24-.91 2.56-1.8.31-.88.31-1.63.22-1.8-.1-.16-.35-.25-.73-.44Z"/>
    </svg>
  );
}
