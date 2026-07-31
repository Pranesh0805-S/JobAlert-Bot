import { useRef, useState } from "react";

export default function PhoneMockup() {
  const wrapRef = useRef(null);
  const [style, setStyle] = useState({});

  function handleMouseMove(e) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(0)`,
    });
  }

  function handleMouseLeave() {
    setStyle({ transform: "rotateY(0deg) rotateX(0deg)" });
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="tilt-wrap [perspective:1200px] w-full max-w-[300px] mx-auto"
    >
      <div
        style={style}
        className="tilt-wrap rounded-[2.2rem] border-[6px] border-[#1c2740] bg-[#0f1830] shadow-[0_30px_80px_-20px_rgba(124,108,246,0.45)] p-3"
      >
        <div className="rounded-[1.6rem] overflow-hidden bg-[#0b1220]">
          <div className="flex items-center gap-2 bg-[#111a2e] px-4 py-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
              JB
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">JobAlert Bot</p>
              <p className="text-[11px] text-emerald-400/80 leading-none mt-1">online</p>
            </div>
          </div>

          <div className="p-3 space-y-2 min-h-[340px] flex flex-col justify-end">
            <div className="chat-bubble self-start bg-[#1c2740] text-[12px] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%]">
              Hi! Tell me your interests and forward me any job post 👋
            </div>
            <div className="chat-bubble self-end bg-accentDim/90 text-[12px] rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
              backend development, fintech
            </div>
            <div className="chat-bubble self-start bg-[#1c2740] text-[11px] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[90%] leading-relaxed">
              📋 <b>Job Post Extracted</b><br/>
              🏢 Zoho — Backend Developer<br/>
              📍 Chennai · 💰 6 LPA<br/>
              🎯 92% match to your interests
            </div>
            <div className="chat-bubble self-start bg-[#1c2740] text-[11px] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%]">
              👀 Looks like a post you've already seen — skipping duplicate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
