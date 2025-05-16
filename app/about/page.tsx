// components/GradeLegend.tsx
'use client';
export default function GradeLegend() {
  const tiers = [
    { t: 'High',       c: 'bg-emerald-600', d: '≥1 human RCT with lifespan / validated biomarker' },
    { t: 'Moderate',   c: 'bg-yellow-400 text-black', d: 'Human pilot + ≥1 mammal study' },
    { t: 'Low',        c: 'bg-orange-500', d: '≥2 concordant mammal studies' },
    { t: 'Very low',   c: 'bg-red-500',    d: 'Single mammal or invertebrate only' },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 my-6">
      {tiers.map(({ t, c, d }) => (
        <div key={t} className="flex items-start gap-3 p-3 rounded-lg shadow-sm bg-white dark:bg-zinc-800">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${c}`}>{t}</span>
          <p className="text-sm leading-snug">{d}</p>
        </div>
      ))}
    </div>
  );
}
