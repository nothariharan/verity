const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Icon = {
  list: () => (
    <svg {...base}><path d="M5.5 4h8M5.5 8h8M5.5 12h8" /><circle cx="2.5" cy="4" r=".6" fill="currentColor" /><circle cx="2.5" cy="8" r=".6" fill="currentColor" /><circle cx="2.5" cy="12" r=".6" fill="currentColor" /></svg>
  ),
  plus: () => (<svg {...base}><path d="M8 3v10M3 8h10" /></svg>),
  live: () => (<svg {...base}><circle cx="8" cy="8" r="2" fill="currentColor" /><path d="M4.2 4.2a5.4 5.4 0 0 0 0 7.6M11.8 4.2a5.4 5.4 0 0 1 0 7.6" /></svg>),
  cases: () => (<svg {...base}><circle cx="8" cy="8" r="5.5" /><path d="M8 2.5A5.5 5.5 0 0 1 13.5 8" strokeWidth="2.2" /></svg>),
  doc: () => (<svg {...base}><path d="M4 1.8h5.5L12.5 5v9.2H4z" /><path d="M9.3 1.8V5h3.2M6 8h4.5M6 10.7h4.5" /></svg>),
  transcript: () => (<svg {...base}><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" /><path d="M5 6.2h6M5 8.2h4" /></svg>),
  mic: () => (<svg {...base}><rect x="5.8" y="1.8" width="4.4" height="8" rx="2.2" /><path d="M3.5 7.8a4.5 4.5 0 0 0 9 0M8 12.3v2" /></svg>),
  growth: () => (<svg {...base}><path d="M2 12.5l4-4 2.5 2.5L14 5.5" /><path d="M10.5 5.5H14V9" /></svg>),
  shield: () => (<svg {...base}><path d="M8 1.8l5 2v4c0 3-2.2 5.3-5 6.4C5.2 13.1 3 10.8 3 7.8v-4z" /></svg>),
  play: () => (<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>),
  pause: () => (<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>),
  check: () => (<svg {...base}><path d="M3 8.5l3 3 7-7" /></svg>),
  arrow: () => (<svg {...base}><path d="M3 8h9m-3.5-4L12 8l-3.5 4" /></svg>),
  upload: () => (<svg {...base}><path d="M8 11V2.5M4.5 6L8 2.5 11.5 6M2.5 11v2.5h11V11" /></svg>),
};
