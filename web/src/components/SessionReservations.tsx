"use client";

import { useState } from "react";

export interface ReservableSession {
  id: string;
  title: string;
  track: string;
  startsAtIso: string;
  endsAtIso: string;
  capacity: number | null;
  reservedCount: number;
}

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function SessionReservations({
  registrationId,
  qrToken,
  sessions,
  initialReservedIds,
}: {
  registrationId: string;
  qrToken: string;
  sessions: ReservableSession[];
  initialReservedIds: string[];
}) {
  const [reserved, setReserved] = useState(new Set(initialReservedIds));
  const [counts, setCounts] = useState(
    new Map(sessions.map((s) => [s.id, s.reservedCount]))
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(session: ReservableSession) {
    const isReserved = reserved.has(session.id);
    setBusyId(session.id);
    setError(null);
    try {
      const res = await fetch("/api/sessions/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          k: qrToken,
          sessionId: session.id,
          action: isReserved ? "cancel" : "reserve",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "予約に失敗しました");

      setReserved((prev) => {
        const next = new Set(prev);
        if (isReserved) next.delete(session.id);
        else next.add(session.id);
        return next;
      });
      if (session.capacity != null && data.remaining != null) {
        setCounts((prev) => new Map(prev).set(session.id, session.capacity! - data.remaining));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約に失敗しました");
    } finally {
      setBusyId(null);
    }
  }

  if (sessions.length === 0) return null;

  return (
    <div className="mt-8 border-t border-dashed border-zinc-200 pt-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
        セッション予約
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-3 space-y-3">
        {sessions.map((s) => {
          const isReserved = reserved.has(s.id);
          const count = counts.get(s.id) ?? s.reservedCount;
          const full = s.capacity != null && count >= s.capacity && !isReserved;
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold tabular-nums text-zinc-500">
                  {timeFmt.format(new Date(s.startsAtIso))} – {timeFmt.format(new Date(s.endsAtIso))}
                  {s.track ? ` ・ ${s.track}` : ""}
                </p>
                <p className="truncate text-sm font-bold">{s.title}</p>
                {s.capacity != null && (
                  <p className="text-xs text-zinc-400">
                    {full ? "満席" : `残り ${s.capacity - count} / ${s.capacity} 席`}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggle(s)}
                disabled={busyId === s.id || (full && !isReserved)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors disabled:opacity-40 ${
                  isReserved
                    ? "border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
                    : "bg-zinc-950 text-white hover:bg-zinc-700"
                }`}
              >
                {busyId === s.id ? "…" : isReserved ? "予約済み・取消" : full ? "満席" : "予約する"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
