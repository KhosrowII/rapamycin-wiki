'use client';

/* ─────────────── 1 Imports ───────────────────────────── */
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  XAxis,
} from 'recharts';

// allow JSON imports even if tsconfig lacks `resolveJsonModule`
// @ts-ignore
import compoundsRaw from '../data/compounds.json';
// @ts-ignore
import overridesRaw from '../data/overrides.json';

/* ─────────────── 2 Types ─────────────────────────────── */
interface Study {
  year?: number;
  delta: number;
  pmid: string;
  model: string;
}
interface Compound {
  id: number;
  compound: string;
  mean_delta?: number;
  best_delta?: number;
  class?: string;
  grade?: string;
  model?: string;
  itp?: string;
  is_orba?: boolean;
  studies?: Study[];
  /** any runtime merge fields */
  [k: string]: unknown;
}

/* ─────────────── 3 Helpers ───────────────────────────── */
const isMammal = (m = '') =>
  /\b(mus |rattus|canis|macaca|homo|equus|bos|sus|cavia|ovis|meso|perom)\b/i.test(
    m,
  );

const gradeColor = (g = '') =>
  g === 'High'
    ? 'bg-emerald-600'
    : g === 'Moderate'
    ? 'bg-yellow-400'
    : g === 'Low'
    ? 'bg-orange-500'
    : 'bg-red-500';

const classColor = (c = '') =>
  c.includes('mTOR')
    ? 'bg-blue-600'
    : c.includes('AMPK')
    ? 'bg-pink-500'
    : c.includes('Senolytic')
    ? 'bg-purple-600'
    : c.includes('Antioxidant')
    ? 'bg-orange-500'
    : 'bg-slate-400';

    function Spark({ studies }: { studies: Study[] }) {
      const data = studies
        .filter((s) => typeof s.year === 'number')
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
        .map((s) => ({ x: s.year, y: s.delta }));
    
      if (data.length < 2) return null;
    
      const last = data[data.length - 1];
    
      return (
        <div className="relative w-[90px] h-[26px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {/* grey baseline */}
              <Line isAnimationActive={false} type="linear" dataKey={() => 0} stroke="#CBD5E1" strokeWidth={1} dot={false} />
              {/* lifespan line */}
              <Line isAnimationActive={false} type="monotone" dataKey="y" strokeWidth={2} dot={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <XAxis hide dataKey="x" />
            </LineChart>
          </ResponsiveContainer>
          {/* value label on last point */}
          <span
            className="absolute -right-1 -top-1 text-[10px] font-mono"
            style={{ color: last.y > 0 ? '#047857' : '#b91c1c' }}
          >
            {last.y > 0 ? '+' : ''}
            {Math.round(last.y)}
          </span>
        </div>
      );
    }
    

/* ───────────── 4 Merge overrides ──────────────────────── */
const compounds: Compound[] = (compoundsRaw as unknown as Compound[]).map(
  (r, i) => ({
    id: i,
    ...r,
  }),
);
const overrides: Compound[] = overridesRaw as unknown as Compound[];

const merged: Compound[] = compounds.map((r) => {
  const over = overrides.find((o) => o.compound === r.compound);
  return over ? { ...r, ...over } : r;
});
// FIX-CLASS-NORMALISE ────────────────────────────────────────────
for (const c of merged) {
  // accept several possible keys from different data sources
  if (c.class === undefined) {
    // legacy “moa” → “class”
    // @ts-ignore
    if (c.moa) c.class = c.moa as unknown as string;

    // if still empty, mark explicitly so the UI shows "—"
    if (!c.class) c.class = '';
  }
}
// ────────────────────────────────────────────────────────────────

/* ───────────── 5 Column definitions ──────────────────── */
const signalCols: ColumnDef<Compound>[] = [
// FIX-COMPOUND-LINK ----------------------------------
{
  accessorKey: 'compound',
  header: 'Compound',
  cell: ({ row }) => (
    <a
      href={`/compound/${encodeURIComponent(row.original.compound)}`}
      className="underline text-emerald-700"
    >
      {row.original.compound}
    </a>
  ),
},
// --------------------------------------------------

  {
    accessorKey: 'studies',
    header: 'Δ-timeline',
    cell: ({ getValue }) => (
      <Spark studies={(getValue() as Study[]) ?? []} />
    ),
  },
  {
    accessorKey: 'mean_delta',
    header: 'μΔ (%)',
    cell: ({ getValue }) => {
      const v = getValue() as number | undefined;
      return <span className="font-mono">{v?.toFixed?.(1) ?? '—'}</span>;
    },
  },
  {
    accessorKey: 'grade',
    header: 'GRADE',
    cell: ({ getValue }) => (
      <span
        className={`whitespace-nowrap text-xs text-white px-2 py-0.5 rounded-full ${gradeColor(
          getValue() as string,
        )}`}
      >
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: 'class',
    header: 'Class',
    cell: ({ getValue }) => (
      <span
        className={`whitespace-nowrap text-xs text-white px-2 py-0.5 rounded ${classColor(
          getValue() as string,
        )}`}
      >
        {(getValue() as string) || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'best_delta',
    header: 'Best Δ',
    cell: ({ getValue }) => {
      const v = getValue() as number | string | undefined;
      return <span className="font-mono">{v ?? '—'}</span>;
    },
  },
];

const recentCols: ColumnDef<any>[] = [
  { accessorKey: 'year', header: 'Year' },
  {
    accessorKey: 'compound',
    header: 'Compound',
    cell: ({ row }) => (
      <a
        href={`https://pubmed.ncbi.nlm.nih.gov/${row.original.pmids[0]}/`}
        target="_blank"
        className="underline text-emerald-700"
      >
        {row.original.compound}
      </a>
    ),
  },
  { accessorKey: 'delta', header: 'Δ Life (%)' },
  { accessorKey: 'model', header: 'Model' },
];

/* ───────────── 6 Component ─────────────────────────────── */
export default function Home() {
  const [filters, setFilters] = useState({
    mammal: true,
    itp: false,
    orba: false,
  });
  const [deltaMin, setDeltaMin] = useState(10);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [dark, setDark] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'signal' | 'recent'>('signal');

  const classOptions = useMemo(
    () => ['All', ...new Set(merged.map((r) => r.class ?? ''))],
    [],
  );

  /* flat list for “recent” mode */
  const flatRows = useMemo(() => {
    const arr: any[] = [];
    merged.forEach((c) =>
      c.studies?.forEach((s) =>
        arr.push({
          compound: c.compound,
          year: s.year,
          delta: s.delta,
          pmids: [s.pmid],
          model: s.model,
          class: c.class,
        }),
      ),
    );
    return arr;
  }, []);

  const rawRows = mode === 'signal' ? merged : flatRows;

  const data = useMemo(
    () =>
      rawRows
        .filter((r) =>
          filters.mammal
            ? isMammal(r.model ?? r.studies?.[0]?.model ?? '')
            : true,
        )
        .filter((r) =>
          filters.itp ? (r.itp ?? r.studies?.[0]?.itp) === 'Yes' : true,
        )
        .filter((r) =>
          filters.orba ? (r.is_orba ?? r.studies?.[0]?.is_orba) : true,
        )
        .filter((r) =>
          mode === 'signal'
            ? (r.best_delta ?? 0) >= deltaMin
            : (r.delta ?? 0) >= deltaMin,
        )
        .filter((r) =>
          classFilter === 'All' ? true : r.class === classFilter,
        )
        .filter((r) =>
          r.compound.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          mode === 'signal'
            ? (b.mean_delta ?? 0) - (a.mean_delta ?? 0)
            : (b.year ?? 0) - (a.year ?? 0),
        ),
    [rawRows, filters, deltaMin, classFilter, query, mode],
  );

  const table = useReactTable({
    data,
    columns: mode === 'signal' ? signalCols : recentCols,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ───────────── UI ────────────────────────────────────── */
  return (
    <main
      className={`font-inter ${
        dark ? 'dark bg-zinc-900 text-zinc-100' : ''
      } max-w-6xl mx-auto p-6 space-y-6`}
    >
      {/* Header */}
      {/* Header */}
<div className="flex items-center gap-4">
  <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
    Longevity Leaderboard
  </h1>

  {/* switch modes */}
  <button
    onClick={() => setMode(mode === 'signal' ? 'recent' : 'signal')}
    className="text-xs border rounded px-2 py-1"
  >
    {mode === 'signal' ? 'Newest' : 'Signal'}
  </button>

  {/* link to calendar */}
  <a
    href="/trials"
    className="text-xs border rounded px-2 py-1 hover:bg-emerald-50 dark:hover:bg-zinc-700"
  >
    Trials ⇢
  </a>

  {/* light/dark */}
  <button
    onClick={() => setDark(!dark)}
    className="ml-auto text-xs border rounded px-2 py-1"
  >
    {dark ? 'light' : 'dark'}
  </button>
</div>


      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6">
        {[
          ['Mammals only', 'mammal'],
          ['ITP only', 'itp'],
          ['Ora worm', 'orba'],
        ].map(([lbl, key]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters[key as keyof typeof filters]}
              onChange={(e) =>
                setFilters({ ...filters, [key]: e.target.checked })
              }
              className="h-4 w-4 accent-emerald-600"
            />
            {lbl}
          </label>
        ))}

        <label className="flex items-center gap-2 text-sm">
          Min Δ%:
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={deltaMin}
            onChange={(e) => setDeltaMin(+e.target.value)}
          />
          <span className="w-8 text-right">{deltaMin}</span>
        </label>

       

        <input
          className="border rounded px-2 py-1 text-sm w-64"
          placeholder="Search compound…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto ring-1 ring-gray-300 dark:ring-gray-600 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-zinc-800 text-xs uppercase">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-3 py-2 text-left font-semibold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-3 py-2">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div> {/* end table wrapper */}

{/* ─────────── Footer ─────────── */}
<p className="text-xs text-gray-600 dark:text-zinc-400 space-y-1">
  {data.length} {mode === 'signal' ? 'compounds' : 'study rows'} • last
  build {new Date().toLocaleDateString()}
  <br />
  Data: DrugAge v4 (CC-BY), NIH ITP 2024, Ora Biomedical TSV • Code &amp; dataset MIT-licensed on{' '}
  <a
    href="https://github.com/KhosrowII/rapamycin-wiki"
    className="underline text-emerald-700"
    target="_blank"
  >
    GitHub
  </a>{' '}
  • <a href="/about" className="underline">About&nbsp;&amp; grading</a>
</p>

{/* ─────────── GRADE modal ─────────── */}
{showModal && (
  <div
    className="fixed inset-0 z-[100] grid place-items-center bg-black/30"
    onClick={() => setShowModal(false)}
  >
    <div
      className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 w-80 text-sm space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold mb-2">GRADE tiers</h2>
      <ul className="list-disc pl-4 space-y-1">
        <li><b>High</b> – ≥ 1 human RCT with lifespan / validated biomarker</li>
        <li><b>Moderate</b> – human pilot + ≥ 1 mammal study</li>
        <li><b>Low</b> – ≥ 2 independent mammal studies</li>
        <li><b>Very Low</b> – single mammal or only invertebrate</li>
      </ul>
      <button
        onClick={() => setShowModal(false)}
        className="block ml-auto mt-3 px-3 py-1 border rounded text-xs"
      >
        close
      </button>
    </div>
  </div>
)}
</main>
);
}
