"use client";
import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { EventContentArg } from "@fullcalendar/core";

// render long titles without truncation
function renderEventContent(arg: EventContentArg) {
  return (
    <span className="whitespace-normal leading-tight text-xs">
      {arg.event.title}
    </span>
  );
}

export default function TrialCalendar() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/trials")
      .then((r) => r.json())
      .then((data) =>
        setEvents(
          data.map((t: any) => ({
            id: t.nct,
            title: t.title,
            start:
              t.start?.length === 7
                ? t.start + "-01"
                : t.start, // coerce YYYY-MM→YYYY-MM-01
            color:
              t.status === "RECRUITING"
                ? "#16a34a"
                : t.status?.includes("SUSPENDED")
                ? "#dc2626"
                : "#64748b",
            url: t.url,
            status: t.status,
          }))
        )
      );
  }, []);

  return (
    <>
      {/* color legend */}
      <div className="mb-2 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" />
          Recruiting
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-zinc-500" />
          Other status
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          Suspended / Terminated
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventContent={renderEventContent}
        height="auto"
        eventClick={(info) =>
          window.open(info.event.extendedProps.url, "_blank")
        }
        eventMouseEnter={(info) => {
          const s = info.event.extendedProps.status ?? "—";
          info.el.title = `${s}`;
        }}
      />

      {/* Suggest-a-keyword button */}
      <button
        onClick={() =>
          window.open(
            "https://github.com/KhosrowII/rapamycin-wiki/issues/new?title=Keyword+Suggestion&body=Please+add:+______",
            "_blank"
          )
          
        }
        className="mt-3 rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
      >
        Suggest a keyword
      </button>
    </>
  );
}
