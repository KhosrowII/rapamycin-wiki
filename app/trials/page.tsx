import TrialCalendar from "@/components/TrialCalendar";

export default async function TrialsPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Recruiting Longevity Trials</h1>
      <p className="text-sm text-gray-600">
        Auto-refreshed nightly from ClinicalTrials.gov API.
      </p>
      <TrialCalendar />
    </main>
  );
}
