"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  validateTicketAction,
  checkInTicketAction,
  undoCheckInAction,
  searchAttendeesAction,
  getAttendanceStatsAction,
} from "@/app/actions/checkin";

type ValidatedTicket = {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  categoryName: string;
  eventName: string;
  status: string;
  checkedInAt: string | null;
  checkedInByName: string | null;
} | null;

const outcomeStyles: Record<string, { bg: string; text: string; label: string }> = {
  VALID: { bg: "bg-green-500", text: "text-white", label: "VALID TICKET" },
  ALREADY_CHECKED_IN: { bg: "bg-amber-500", text: "text-white", label: "ALREADY CHECKED IN" },
  REFUNDED: { bg: "bg-red-600", text: "text-white", label: "REFUNDED" },
  CANCELLED: { bg: "bg-red-600", text: "text-white", label: "CANCELLED" },
  INVALID: { bg: "bg-red-600", text: "text-white", label: "INVALID TICKET" },
  EXPIRED: { bg: "bg-gray-600", text: "text-white", label: "EXPIRED" },
  WRONG_EVENT: { bg: "bg-purple-600", text: "text-white", label: "WRONG EVENT" },
  NOT_ACTIVE_YET: { bg: "bg-blue-600", text: "text-white", label: "NOT ACTIVE YET" },
};

export default function CheckinScanner({ eventId }: { eventId: string }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ outcome: string; message: string; ticket: ValidatedTicket } | null>(null);
  const [pending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ total: number; checkedIn: number; recent: { name: string; at: string | null }[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchAttendeesAction>>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function refreshStats() {
    getAttendanceStatsAction(eventId).then(setStats);
  }

  useEffect(() => {
    refreshStats();
  }, [eventId]);

  function submitCode(value: string) {
    if (!value.trim()) return;
    startTransition(async () => {
      const r = await validateTicketAction(value.trim(), eventId);
      setResult(r);
      setCode("");
      inputRef.current?.focus();
    });
  }

  function doCheckIn(ticketId: string) {
    startTransition(async () => {
      await checkInTicketAction(ticketId, eventId);
      const r = await validateTicketAction(ticketId, eventId);
      setResult(r);
      refreshStats();
    });
  }

  function doUndo(ticketId: string) {
    startTransition(async () => {
      await undoCheckInAction(ticketId, eventId);
      const r = await validateTicketAction(ticketId, eventId);
      setResult(r);
      refreshStats();
    });
  }

  function runSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    startTransition(async () => {
      const results = await searchAttendeesAction(eventId, q);
      setSearchResults(results);
    });
  }

  const style = result ? outcomeStyles[result.outcome] ?? outcomeStyles.INVALID : null;

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.checkedIn}</p>
            <p className="text-xs text-gray-400">Checked in</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-400">Total valid tickets</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-xs text-gray-400 mb-1 block">Scan or enter ticket code / number</label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCode(code)}
            className="flex-1 min-w-0 rounded-lg bg-gray-800 border border-gray-700 px-3 py-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="TKT-XXXXXX or code"
          />
          <button onClick={() => submitCode(code)} disabled={pending} className="rounded-lg bg-brand px-4 font-semibold">
            Check
          </button>
        </div>
      </div>

      {result && style && (
        <div className={`rounded-xl p-5 ${style.bg} ${style.text}`}>
          <p className="text-xs font-bold tracking-wide opacity-90">{style.label}</p>
          <p className="text-sm mt-1">{result.message}</p>
          {result.ticket && (
            <div className="mt-3 space-y-1 text-sm">
              <p><strong>{result.ticket.attendeeName}</strong></p>
              <p>{result.ticket.categoryName} · {result.ticket.ticketNumber}</p>
              {result.ticket.checkedInAt && <p className="opacity-80">Checked in: {new Date(result.ticket.checkedInAt).toLocaleString()} by {result.ticket.checkedInByName}</p>}
            </div>
          )}
          {result.outcome === "VALID" && result.ticket && (
            <button onClick={() => doCheckIn(result.ticket!.id)} disabled={pending} className="mt-4 w-full bg-white text-green-700 font-bold py-2 rounded-lg">
              Check In
            </button>
          )}
          {result.outcome === "ALREADY_CHECKED_IN" && result.ticket && (
            <button onClick={() => doUndo(result.ticket!.id)} disabled={pending} className="mt-4 w-full bg-white text-amber-700 font-bold py-2 rounded-lg">
              Undo check-in
            </button>
          )}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-xs text-gray-400 mb-1 block">Search by attendee name or booking number</label>
        <input
          value={searchQuery}
          onChange={(e) => runSearch(e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Search..."
        />
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((r) => (
              <button key={r.id} onClick={() => submitCode(r.ticketNumber)} className="w-full text-left bg-gray-800 rounded-lg p-2 text-sm hover:bg-gray-700">
                <p className="font-medium">{r.attendeeName}</p>
                <p className="text-xs text-gray-400">{r.categoryName} · {r.bookingNumber} · {r.status}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {stats && stats.recent.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">Recent check-ins</p>
          <div className="space-y-1 text-sm">
            {stats.recent.map((r, i) => (
              <div key={i} className="flex justify-between text-gray-300">
                <span>{r.name}</span>
                <span className="text-gray-500">{r.at ? new Date(r.at).toLocaleTimeString() : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
