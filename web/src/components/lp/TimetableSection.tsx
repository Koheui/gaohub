"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PublicEvent, PublicSession, PublicSpeaker } from "@/lib/server/events";
import type { LpTheme } from "@/components/lp/theme";

interface TimetableSectionProps {
  event: PublicEvent;
  sessions: PublicSession[];
  speakers: PublicSpeaker[];
  t: LpTheme;
  dark: boolean;
  color: string;
}

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

const dayFmt = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

// 各ステージに割り当てるフェス風ビビッドカラー
const TRACK_COLORS = [
  { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { bg: "bg-pink-600", text: "text-white", border: "border-pink-500", lightBg: "bg-pink-50 dark:bg-pink-950/30" },
  { bg: "bg-amber-500", text: "text-zinc-950", border: "border-amber-400", lightBg: "bg-amber-50 dark:bg-amber-950/30" },
  { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { bg: "bg-cyan-600", text: "text-white", border: "border-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/30" },
];

export function TimetableSection({
  event,
  sessions,
  speakers,
  t,
  dark,
  color,
}: TimetableSectionProps) {
  const speakerMap = useMemo(() => {
    const map = new Map<string, PublicSpeaker>();
    speakers.forEach((s) => map.set(s.id, s));
    return map;
  }, [speakers]);

  // トラックの抽出 (イベント指定 or セッションから動的抽出)
  const tracks = useMemo(() => {
    if (event.tracks && event.tracks.length > 0) return event.tracks;
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.track) set.add(s.track);
    });
    return set.size > 0 ? Array.from(set) : ["Main Stage"];
  }, [event.tracks, sessions]);

  // デフォルトはフェス風本格タイムテーブル ('matrix')、リスト ('timeline')
  const [viewMode, setViewMode] = useState<"matrix" | "timeline">("matrix");

  // 日付ごとのグループ化
  const days = useMemo(() => {
    const map = new Map<string, PublicSession[]>();
    sessions.forEach((s) => {
      if (s.isComingSoon) return;
      const key = dayFmt.format(s.startsAt);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [sessions]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDaySessions = days[activeDayIndex] ? days[activeDayIndex][1] : [];

  const comingSoonSessions = useMemo(
    () => sessions.filter((s) => s.isComingSoon),
    [sessions]
  );

  // 当日の時間範囲 (最少開始時間 〜 最大終了時間)
  const timelineRange = useMemo(() => {
    if (currentDaySessions.length === 0) {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
      return { startHour: 10, endHour: 18, totalHours: 8, dayStartMs: defaultStart.getTime() };
    }
    let minStart = Infinity;
    let maxEnd = -Infinity;

    currentDaySessions.forEach((s) => {
      const startMs = s.startsAt.getTime();
      const endMs = s.endsAt.getTime();
      if (startMs < minStart) minStart = startMs;
      if (endMs > maxEnd) maxEnd = endMs;
    });

    const startDate = new Date(minStart);
    const endDate = new Date(maxEnd);

    let startHour = startDate.getHours();
    let endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0);

    if (endHour <= startHour) endHour = startHour + 4;
    return {
      startHour,
      endHour,
      totalHours: endHour - startHour,
      dayStartMs: new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startHour,
        0,
        0
      ).getTime(),
    };
  }, [currentDaySessions]);

  // 1時間あたりの固定高さ (フェス風デザイン: 180px)
  const HOUR_HEIGHT = 180;

  // 1時間単位の目盛りラベル一覧
  const hourLabels = useMemo(() => {
    const list: { hour: number; label: string }[] = [];
    for (let h = timelineRange.startHour; h <= timelineRange.endHour; h++) {
      const pad = String(h).padStart(2, "0");
      list.push({ hour: h, label: `${pad}:00` });
    }
    return list;
  }, [timelineRange]);

  return (
    <div className="mt-8">
      {/* ─── コントロールバー (DAY選択 + ビューモード切り替え) ─── */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between border-zinc-200/80 dark:border-white/10">
        {/* DAY切り替えタブ */}
        {days.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto">
            {days.map(([dayKey], idx) => (
              <button
                key={dayKey}
                onClick={() => setActiveDayIndex(idx)}
                className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  activeDayIndex === idx
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md"
                    : `${t.muted} hover:bg-zinc-200/60 dark:hover:bg-zinc-800`
                }`}
              >
                DAY {idx + 1} ({dayKey})
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Fes-Style Timetable Grid
          </div>
        )}

        {/* 表示モード切り替えスイッチ */}
        <div className="flex items-center gap-1 rounded-full border border-zinc-300 p-1 dark:border-white/15 dark:bg-zinc-900/60">
          <button
            onClick={() => setViewMode("matrix")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition-all ${
              viewMode === "matrix"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : `${t.muted} hover:text-zinc-900 dark:hover:text-white`
            }`}
          >
            <span>ステージ別フェス表 📅</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition-all ${
              viewMode === "timeline"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : `${t.muted} hover:text-zinc-900 dark:hover:text-white`
            }`}
          >
            <span>時系列リスト 🕒</span>
          </button>
        </div>
      </div>

      {/* ─── モード 1: 本格フェス風 タイムテーブル (FM802 Radio Crazy スタイル) ─── */}
      {viewMode === "matrix" && (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/15 dark:bg-zinc-950">
          <div className="min-w-[960px]">
            {/* 1. ステージヘッダー行 (カラフルフェスタグ) */}
            <div
              className="sticky top-0 z-20 grid border-b-2 border-zinc-950 bg-zinc-900 shadow-md dark:border-white"
              style={{
                gridTemplateColumns: `80px repeat(${tracks.length}, minmax(0, 1fr)) 80px`,
              }}
            >
              <div className="flex items-center justify-center p-3 font-mono text-xs font-black text-zinc-400">
                TIME
              </div>

              {tracks.map((trackName, tIdx) => {
                const colorConfig = TRACK_COLORS[tIdx % TRACK_COLORS.length];
                return (
                  <div
                    key={trackName}
                    className={`flex items-center justify-center p-3 text-center border-r border-zinc-800 last:border-r-0 ${colorConfig.bg} ${colorConfig.text}`}
                  >
                    <span className="text-sm font-black uppercase tracking-wider">
                      {trackName}
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-center p-3 font-mono text-xs font-black text-zinc-400">
                TIME
              </div>
            </div>

            {/* 2. メイン・タイムラインキャンバス (左右両端に時間目盛り + 30分点線 + フェスカード配置) */}
            <div
              className="relative"
              style={{
                height: `${timelineRange.totalHours * HOUR_HEIGHT}px`,
              }}
            >
              {/* 1時間ごとの固定背景グリッドライン (太線) & 30分補助ライン (点線) */}
              {hourLabels.map((hl, i) => {
                const topPx = i * HOUR_HEIGHT;
                return (
                  <div
                    key={hl.hour}
                    className="absolute inset-x-0 flex pointer-events-none border-b-2 border-cyan-400/40 dark:border-cyan-500/30"
                    style={{ top: `${topPx}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    {/* 左端時間目盛り */}
                    <div className="w-[80px] shrink-0 flex items-start justify-center pt-2 font-mono text-lg font-black tabular-nums tracking-tighter text-zinc-800 dark:text-zinc-200">
                      {hl.label}
                    </div>

                    {/* 中央ステージ別背景カラム & 30分点線 */}
                    <div
                      className="grid flex-1 relative"
                      style={{
                        gridTemplateColumns: `repeat(${tracks.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {/* 30分間隔の点線ライン */}
                      <div
                        className="absolute inset-x-0 border-b border-dashed border-cyan-300/40 dark:border-cyan-600/30"
                        style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      />

                      {tracks.map((tr, idx) => {
                        const colorConfig = TRACK_COLORS[idx % TRACK_COLORS.length];
                        return (
                          <div
                            key={tr}
                            className={`border-r border-cyan-200/50 dark:border-zinc-800 last:border-r-0 h-full ${colorConfig.lightBg}`}
                          />
                        );
                      })}
                    </div>

                    {/* 右端時間目盛り */}
                    <div className="w-[80px] shrink-0 flex items-start justify-center pt-2 font-mono text-lg font-black tabular-nums tracking-tighter text-zinc-800 dark:text-zinc-200">
                      {hl.label}
                    </div>
                  </div>
                );
              })}

              {/* 各ステージのセッションカード配置 (絶対位置 top & height) */}
              <div
                className="absolute inset-y-0 grid left-[80px] right-[80px]"
                style={{
                  gridTemplateColumns: `repeat(${tracks.length}, minmax(0, 1fr))`,
                }}
              >
                {tracks.map((trackName, tIdx) => {
                  const trackSessions = currentDaySessions.filter(
                    (s) =>
                      (s.track && tracks.includes(s.track) ? s.track : tracks[0]) ===
                      trackName
                  );

                  return (
                    <div key={trackName} className="relative h-full px-2">
                      {trackSessions.map((s) => {
                        const startMs = s.startsAt.getTime();
                        const endMs = s.endsAt.getTime();
                        const durationMins = Math.max(
                          (endMs - startMs) / (1000 * 60),
                          15
                        );

                        const startOffsetMins =
                          (startMs - timelineRange.dayStartMs) / (1000 * 60);

                        const topPx = (startOffsetMins / 60) * HOUR_HEIGHT;
                        const heightPx = (durationMins / 60) * HOUR_HEIGHT;

                        const sessionSpeakers = s.speakerIds
                          .map((sid) => speakerMap.get(sid))
                          .filter((sp): sp is PublicSpeaker => !!sp);

                        const bannerUrl =
                          s.customBannerUrl ||
                          `/api/banner/${event.id}/sessions/${s.id}?size=wide`;

                        return (
                          <div
                            key={s.id}
                            style={{
                              top: `${topPx + 4}px`,
                              height: `${Math.max(heightPx - 8, 88)}px`,
                            }}
                            className="group absolute inset-x-1.5 z-10 flex flex-col overflow-hidden rounded-xl border-2 border-amber-300 bg-amber-100 shadow-md transition-all duration-300 hover:z-30 hover:scale-[1.03] hover:shadow-2xl dark:border-amber-400 dark:bg-amber-950/90 text-zinc-950 dark:text-amber-100"
                          >
                            <Link
                              href={`/e/${event.slug}/sessions/${s.id}`}
                              className="flex h-full flex-col min-h-0 p-2.5"
                            >
                              {/* 時間ラベル (12:05 >> スタイル) */}
                              <div className="flex items-center justify-between border-b pb-1 border-amber-300/80 dark:border-amber-800">
                                <span className="font-mono text-xs font-black tracking-tight text-amber-900 dark:text-amber-300">
                                  {timeFmt.format(s.startsAt)} &gt;&gt;
                                </span>
                                <span className="font-mono text-[10px] font-bold opacity-75">
                                  {durationMins}分
                                </span>
                              </div>

                              {/* セッション名 (大迫力中央表記) */}
                              <div className="my-auto text-center py-1">
                                <h4 className="text-sm font-black leading-tight tracking-tight line-clamp-2 group-hover:underline">
                                  {s.title}
                                </h4>
                              </div>

                              {/* セッション告知バナーサムネイル + 登壇者 */}
                              <div className="flex items-center gap-2 pt-1 border-t border-amber-300/60 dark:border-amber-800 shrink-0">
                                <div className="h-7 w-12 shrink-0 overflow-hidden rounded border border-amber-400 bg-zinc-950">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={bannerUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                {sessionSpeakers.length > 0 && (
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    {sessionSpeakers.slice(0, 2).map((sp) => (
                                      <span
                                        key={sp.id}
                                        className="truncate text-[10px] font-bold text-amber-900 dark:text-amber-200"
                                      >
                                        {sp.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── モード 2: 時系列シングルリストビュー (TIMELINE) ─── */}
      {viewMode === "timeline" && (
        <ol className="mt-8 divide-y divide-zinc-200/80 dark:divide-white/10">
          {currentDaySessions.map((s) => {
            const sessionSpeakers = s.speakerIds
              .map((sid) => speakerMap.get(sid))
              .filter((sp): sp is PublicSpeaker => !!sp);
            const bannerUrl =
              s.customBannerUrl || `/api/banner/${event.id}/sessions/${s.id}?size=wide`;

            return (
              <li key={s.id} className="group py-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  {/* 時間・トラック情報 */}
                  <div className="w-36 shrink-0">
                    <p className="font-mono text-xl font-black tabular-nums leading-none">
                      {timeFmt.format(s.startsAt)}
                    </p>
                    <p className={`mt-1 font-mono text-xs font-bold tabular-nums ${t.muted}`}>
                      – {timeFmt.format(s.endsAt)}
                    </p>
                    {s.track && (
                      <span
                        className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {s.track}
                      </span>
                    )}
                  </div>

                  {/* セッションテキスト */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/e/${event.slug}/sessions/${s.id}`}
                        className="hover:underline"
                      >
                        <h4 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                          {s.title}
                        </h4>
                      </Link>
                      {s.capacity != null && (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
                            s.reservedCount >= s.capacity
                              ? "bg-red-600/90 text-white"
                              : `${t.muted} ${dark ? "bg-white/10" : "bg-zinc-100"}`
                          }`}
                        >
                          {s.reservedCount >= s.capacity
                            ? "満席"
                            : `残り${s.capacity - s.reservedCount}席`}
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p className={`mt-3 text-sm leading-relaxed ${t.muted}`}>
                        {s.description}
                      </p>
                    )}
                    {sessionSpeakers.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                        {sessionSpeakers.map((sp) => (
                          <Link
                            key={sp.id}
                            href={`/e/${event.slug}/speakers/${sp.id}`}
                            className="group/sp flex items-center gap-2.5"
                          >
                            {sp.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sp.photoUrl}
                                alt={sp.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300 text-xs font-black">
                                {sp.name.charAt(0)}
                              </span>
                            )}
                            <span className="leading-tight">
                              <span className="block text-sm font-black group-hover/sp:underline">
                                {sp.name}
                              </span>
                              <span className={`block text-[11px] font-bold uppercase tracking-wider ${t.muted}`}>
                                {[sp.company, sp.title].filter(Boolean).join(" / ")}
                              </span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* セッションバナー画像 (アイキャッチ) */}
                  <div className="w-full shrink-0 lg:w-72">
                    <Link
                      href={`/e/${event.slug}/sessions/${s.id}`}
                      className="group/banner relative block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-white/10 dark:bg-zinc-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerUrl}
                        alt={s.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/banner:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/banner:opacity-100 flex items-end p-4">
                        <span className="text-xs font-black tracking-wider text-white">
                          セッション詳細を見る →
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* ─── Coming Soon セッション ─── */}
      {comingSoonSessions.length > 0 && (
        <div className="mt-16 border-t pt-12 border-zinc-200/80 dark:border-white/10">
          <h3 className={`text-sm font-black uppercase tracking-[0.25em] ${t.muted}`}>
            Coming Soon Sessions
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {comingSoonSessions.map((s) => {
              const bannerUrl =
                s.customBannerUrl || `/api/banner/${event.id}/sessions/${s.id}?size=wide`;
              return (
                <div
                  key={s.id}
                  className="group/cs relative overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-5 dark:border-white/20 dark:bg-zinc-900/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm sm:w-44 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerUrl}
                        alt={s.title}
                        className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover/cs:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-white dark:bg-white dark:text-zinc-900">
                        Coming Soon
                      </span>
                      <h4 className="mt-2 text-lg font-black leading-snug">{s.title}</h4>
                      {s.description && (
                        <p className={`mt-1 text-xs line-clamp-2 ${t.muted}`}>
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
