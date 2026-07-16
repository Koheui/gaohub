"use client";

import type { AdminEventsByStatus } from "@/lib/admin/types";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-white/15 bg-white/[0.03] p-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        [{label}]
      </p>
      <p className="mt-3 text-4xl font-black tabular-nums tracking-tighter">{value}</p>
      {sub && <p className="mt-2 text-xs font-bold text-zinc-500">{sub}</p>}
    </div>
  );
}

// dataviz スキルの検証済みパレット(dark, categorical slot 2/3/5)から採用。
// node scripts/validate_palette.js "#199e70,#c98500,#9085e9" --mode dark → ALL CHECKS PASS
const STATUS_META = {
  published: { label: "公開中", color: "#199e70" },
  draft: { label: "下書き", color: "#c98500" },
  ended: { label: "終了", color: "#9085e9" },
} as const;

/** イベントステータスの内訳を100%積み上げバーで表示する(カテゴリは固定順・固定色) */
export function EventsStatusBar({ counts }: { counts: AdminEventsByStatus }) {
  const total = counts.published + counts.draft + counts.ended;
  const order: (keyof AdminEventsByStatus)[] = ["published", "draft", "ended"];

  return (
    <div className="border border-white/15 bg-white/[0.03] p-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        [Event Status]
      </p>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        {total === 0 ? (
          <div className="h-full w-full" />
        ) : (
          order.map((key) => {
            const pct = (counts[key] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: STATUS_META[key].color }}
                title={`${STATUS_META[key].label}: ${counts[key]}`}
              />
            );
          })
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {order.map((key) => (
          <div key={key} className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_META[key].color }}
            />
            {STATUS_META[key].label}
            <span className="tabular-nums text-zinc-500">{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
