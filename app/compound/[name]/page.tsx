'use client';

/*────────────────────────────────────────────────────────────────────────*/
/* 1 Imports                                                            */
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowData,
} from '@tanstack/react-table';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// @ts-ignore
import compounds from '../../../data/compounds.json';

/*────────────────────────────────────────────────────────────────────────*/
/* 2 Types & PubMed hook                                                 */
type Study = { year?: number; delta: number; pmid: string; model: string };
type Compound = {
  compound: string;
  mean_delta?: number;
  best_delta?: number;
  class?: string;
  grade?: string;
  studies: Study[];
};

function useTitle(pmid: string) {
  const [title, setTitle] = useState<string>('');
  useEffect(() => {
    fetch(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/?format=pubmed`)
      .then((r) => r.text())
      .then((txt) => {
        const m = txt.match(/TI  - (.+)/);
        if (m) setTitle(m[1]);
      })
      .catch(() => {});
  }, [pmid]);
  return title;
}

/*────────────────────────────────────────────────────────────────────────*/
/* 3 Component                                                          */
export default function CompoundPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const slug = decodeURIComponent(name).toLowerCase();

  const rec = (compounds as Compound[]).find(
    (c) => c.compound.toLowerCase() === slug,
  );
  if (!rec) return <p className="p-6">No data for “{slug}”</p>;

  /* spark-line same as before */
  const sparkData = rec.studies
    .filter((s) => typeof s.year === 'number')
    .sort((a, b) => (a.year! - b.year!))
    .map((s) => ({ x: s.year, y: s.delta }));

  /* table of individual studies */
  const table = useReactTable<RowData>({
    data: rec.studies,
    columns: [
      { accessorKey: 'year', header: 'Year' },
      { accessorKey: 'model', header: 'Model' },
      {
        accessorKey: 'delta',
        header: 'Δ Life (%)',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'pmid',
        header: 'PubMed',
        cell: (info) => {
          const pmid = info.getValue<string>();
          const title = useTitle(pmid);
          return (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
              target="_blank"
              className="underline text-emerald-700 text-sm"
            >
              {title ? title.slice(0, 60) + '…' : `PMID ${pmid}`}
            </a>
          );
        },
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="max-w-3xl p-6 mx-auto space-y-6">
      <button onClick={() => router.back()} className="underline text-sm">
        ← back
      </button>
      <h1 className="text-3xl font-bold">{rec.compound}</h1>
      <div className="space-y-1 text-sm">
        <p><b>Class:</b> {rec.class}</p>
        <p><b>GRADE:</b> {rec.grade}</p>
        <p><b>Mean Δ:</b> {rec.mean_delta}%</p>
        <p><b>Best Δ:</b> {rec.best_delta}%</p>
      </div>
      {sparkData.length > 1 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="y" strokeWidth={2} />
              <XAxis dataKey="x" />
              <YAxis />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="overflow-x-auto ring-1 ring-gray-300 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-xs uppercase">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-2 py-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r, i) => (
              <tr
                key={i}
                className={i % 2 ? 'bg-white' : 'bg-gray-50'}
              >
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-2 py-1">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
