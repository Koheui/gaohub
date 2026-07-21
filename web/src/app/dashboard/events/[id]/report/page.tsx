"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { ui } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";
import type { Distribution, EventReport } from "@/lib/server/eventReport";

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className={`flex flex-col justify-between p-5 ${ui.card}`}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </span>
      <span className="mt-3 text-4xl font-black tabular-nums tracking-tighter">{value}</span>
      {sub && <span className="mt-1 text-xs font-medium text-zinc-500">{sub}</span>}
    </div>
  );
}

/** 横棒グラフ。最大値を基準に幅を出す。 */
function BarList({
  items,
  total,
  emptyLabel = "データがありません",
  unit = "名",
}: {
  items: Distribution[];
  total?: number;
  emptyLabel?: string;
  unit?: string;
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-zinc-400">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  const denom = total ?? items.reduce((s, i) => s + i.count, 0);
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((it) => {
        const pct = denom ? Math.round((it.count / denom) * 100) : 0;
        return (
          <li key={it.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-bold">{it.label}</span>
              <span className="shrink-0 tabular-nums text-zinc-500">
                {it.count}
                {unit} {denom > 0 && <span className="text-zinc-400">({pct}%)</span>}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${(it.count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={`p-6 ${ui.card}`}>
      <h2 className={ui.h2}>{title}</h2>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
      {children}
    </section>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<EventReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const user = auth.currentUser;
      if (!user) return; // 認証確定待ち(下の onAuthStateChanged 相当は AuthProvider が担保)
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/events/${id}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "読み込みに失敗しました");
        setReport(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      }
    }
    // currentUser がまだ無い場合に備えて少し待ってからリトライ
    const unsub = auth.onAuthStateChanged(() => load());
    load();
    return () => {
      cancelled = true;
      unsub();
    };
  }, [id]);

  const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={ui.label}>Attendee Report</p>
          <h1 className={`mt-2 ${ui.h1}`}>参加者レポート</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            どこからどんな参加者が集まり、どのコンテンツに人気が集まったかを集計します。
            主催者へのフィードバック資料としてご活用ください。
          </p>
        </div>
        <div>
          <Link href={`/dashboard/events/${id}/attendees`} className={ui.btnGhost}>
            申込者一覧・CSV
          </Link>
        </div>
      </div>

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!report && !error && <p className="mt-8 text-sm text-zinc-400">集計中…</p>}

      {report && (
        <div className="mt-8 space-y-6">
          {/* サマリー */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Confirmed"
              value={report.totals.confirmed}
              sub={`決済待ち ${report.totals.pendingPayment} ・ キャンセル ${report.totals.cancelled}`}
            />
            <StatTile
              label="Checked in"
              value={report.totals.checkedIn}
              sub={`チェックイン率 ${pct(report.totals.checkinRate)}`}
            />
            <StatTile label="Revenue" value={yen(report.totals.revenue)} sub="確定分の合計" />
            <StatTile
              label="Lounge"
              value={report.lounge.enabled ? report.lounge.joined : "—"}
              sub={
                report.lounge.enabled
                  ? `参加率 ${pct(report.lounge.rate)}`
                  : "ラウンジ無効"
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="チケット種別の内訳">
              <BarList
                items={report.ticketBreakdown}
                total={report.totals.confirmed}
                unit="名"
              />
              {report.ticketBreakdown.length > 0 && (
                <p className="mt-4 text-xs text-zinc-500">
                  売上上位:{" "}
                  {[...report.ticketBreakdown]
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 3)
                    .map((t) => `${t.label} ${yen(t.revenue)}`)
                    .join(" / ")}
                </p>
              )}
            </Section>

            <Section
              title="人気コンテンツ(セッション予約数)"
              note={`予約総数 ${report.totalReservations} 件。どのコンテンツに関心が集まったかの指標です。`}
            >
              <BarList
                items={report.sessions
                  .filter((s) => !s.isComingSoon)
                  .map((s) => ({
                    label: s.track ? `${s.title}(${s.track})` : s.title,
                    count: s.reservedCount,
                  }))}
                unit="件"
                emptyLabel="予約対象のセッションがありません"
              />
            </Section>

            <Section
              title="所属(会社・組織)"
              note="参加者が入力した会社名の上位。どんな組織から来ているかを把握できます。"
            >
              <BarList items={report.byCompany} total={report.totals.confirmed} />
            </Section>

            <Section title="役職・肩書">
              <BarList items={report.byJobTitle} total={report.totals.confirmed} />
            </Section>

            {report.questions.map((q) => (
              <Section key={q.id} title={q.label} note={`回答 ${q.answered} 件`}>
                <BarList items={q.options} total={q.answered} unit="件" />
              </Section>
            ))}

            <Section title="日別の申込推移" note="申込確定日(JST)ごとの件数">
              <BarList items={report.daily} unit="件" total={report.totals.confirmed} />
            </Section>
          </div>

          <p className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Generated {new Date(report.generatedAt).toLocaleString("ja-JP")}
          </p>
        </div>
      )}
    </div>
  );
}
