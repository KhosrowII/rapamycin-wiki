export default function About() {
  return (
    <main className="prose dark:prose-invert mx-auto p-6">
      <h1>Rapamycin.Wiki – Methodology</h1>

      <h2>Data ingestion</h2>
      <ul>
        <li><b>DrugAge</b> v4.0 – 1 078 intervention records</li>
        <li><b>NIH ITP</b> – 2024 meta-analysis table</li>
        <li><b>Orba Biomedical</b> – 317 C. elegans replicates</li>
      </ul>

      <h2>Class / Mechanism assignment</h2>
      <ol>
        <li>Manual dictionary for top 120 longevity compounds.</li>
        <li>
          <b>ATC-prefix map</b> from DrugBank → covers all drugs with approved ATC codes.
        </li>
        <li>
          <b>ChEMBL API scrape</b> – scans “mechanism of action” text for keywords (mTOR,
          AMPK, SGLT2…). Adds ~250 more MOA tags.
        </li>
      </ol>
      <p>
        Remaining “Unclassified” rows invite community suggestions via the hover-card
        link.
      </p>

      <h2>Evidence grades (adapted GRADE)</h2>
      <table>
        <thead><tr><th>Grade</th><th>Criteria</th></tr></thead>
        <tbody>
          <tr><td>High</td><td>≥ 1 human RCT with lifespan or validated aging biomarker.</td></tr>
          <tr><td>Moderate</td><td>Human pilot study <em>and</em> ≥ 1 mammal lifespan experiment.</td></tr>
          <tr><td>Low</td><td>≥ 2 concordant mammal lifespan studies.</td></tr>
          <tr><td>Very low</td><td>Single mammal study or invertebrate only.</td></tr>
        </tbody>
      </table>

      <h2>Roadmap</h2>
      <ul>
        <li><b>Q3 2025</b> – weighted mean lifespan Δ per compound.</li>
        <li><b>Q4 2025</b> – human biomarker & functional-aging endpoints.</li>
        <li><b>2026</b> – write-API & nightly PubMed ingest.</li>
      </ul>

      <h2>Licence</h2>
      <p>
        Dataset CC-BY; code MIT. GitHub repo:&nbsp;
        <a href="https://github.com/yourrepo">github.com/yourrepo</a>
      </p>
    </main>
  );
}
