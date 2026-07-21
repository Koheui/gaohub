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

// デフォルトのステージ別カラーパレット (主催者未指定時のプリセット)
const DEFAULT_TRACK_COLORS = [
  "#e11d48", // 赤・ローズ (Main Stage等)
  "#2563eb", // 青・ロイヤルブルー (Sub1 Stage等)
  "#059669", // 緑・エメラルド (Sub2 Stage等)
  "#7c3aed", // 紫・バイオレット
  "#d97706", // オレンジ・アンバー
  "#0891b2", // シアン
  "#db2777", // ピンク
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

  // ステージ名 -> カラーコード (Hex) のマップを取得
  const getTrackColor = useMemo(() => {
    const trackColorMap = event.trackColors ?? {};
    return (trackName: string) => {
      if (trackColorMap[trackName]) return trackColorMap[trackName];
      const idx = tracks.indexOf(trackName);
      const safeIdx = idx >= 0 ? idx : 0;
      return DEFAULT_TRACK_COLORS[safeIdx % DEFAULT_TRACK_COLORS.length];
    };
  }, [event.trackColors, tracks]);

  // デフォルトはタイムスケジュール表 ('matrix')、リスト ('timeline')
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

  // 1時間あたりの固定高さ (ピクセル)
  const HOUR_HEIGHT = 220;

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
            Timetable & Schedule Grid
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
            <span>ステージ別スケジュール表 📊</span>
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

      {/* ─── モード 1: ステージ別スケジュール表 ─── */}
      {viewMode === "matrix" && (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-zinc-200/80 bg-white/80 shadow-xl dark:border-white/10 dark:bg-zinc-950/80">
          <div className="min-w-[960px]">
            {/* 1. ヘッダー行 (ステージ一覧 & ステージカラータグ) */}
            <div
              className="sticky top-0 z-20 grid border-b border-zinc-200/80 bg-zinc-100/90 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90"
              style={{
                gridTemplateColumns: `80px repeat(${tracks.length}, minmax(0, 1fr)) 80px`,
              }}
            >
              <div className="flex items-center justify-center p-4 font-mono text-xs font-black uppercase tracking-widest text-zinc-400">
                TIME
              </div>
              {tracks.map((trackName, tIdx) => {
                const trackColor = getTrackColor(trackName);
                return (
                  <div
                    key={trackName}
                    className="flex items-center justify-between border-r px-6 py-4 border-zinc-200 dark:border-white/10 last:border-r-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: trackColor }}
                      />
                      <span className="text-base font-black tracking-tight">{trackName}</span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm"
                      style={{ backgroundColor: trackColor }}
                    >
                      STAGE {tIdx + 1}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-center p-4 font-mono text-xs font-black uppercase tracking-widest text-zinc-400">
                TIME
              </div>
            </div>

            {/* 2. メイン・キャンバス */}
            <div
              className="relative"
              style={{
                height: `${timelineRange.totalHours * HOUR_HEIGHT}px`,
              }}
            >
              {/* 1時間ごとの固定背景グリッドライン & 30分点線 */}
              {hourLabels.map((hl, i) => {
                const topPx = i * HOUR_HEIGHT;
                return (
                  <div
                    key={hl.hour}
                    className="absolute inset-x-0 flex pointer-events-none border-b border-zinc-200/80 dark:border-white/10"
                    style={{ top: `${topPx}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-[80px] shrink-0 border-r border-zinc-200/80 p-3 text-center dark:border-white/10">
                      <span className="font-mono text-base font-black tabular-nums tracking-tight">
                        {hl.label}
                      </span>
                    </div>

                    <div
                      className="grid flex-1 relative"
                      style={{
                        gridTemplateColumns: `repeat(${tracks.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div
                        className="absolute inset-x-0 border-b border-dashed border-zinc-200/50 dark:border-white/10"
                        style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      />

                      {tracks.map((tr) => (
                        <div
                          key={tr}
                          className="border-r border-zinc-100 dark:border-white/5 last:border-r-0 h-full"
                        />
                      ))}
                    </div>

                    <div className="w-[80px] shrink-0 border-l border-zinc-200/80 p-3 text-center dark:border-white/10">
                      <span className="font-mono text-base font-black tabular-nums tracking-tight">
                        {hl.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* 各ステージのセッションカード配置 */}
              <div
                className="absolute inset-y-0 grid left-[80px] right-[80px]"
                style={{
                  gridTemplateColumns: `repeat(${tracks.length}, minmax(0, 1fr))`,
                }}
              >
                {tracks.map((trackName) => {
                  const trackSessions = currentDaySessions.filter(
                    (s) =>
                      (s.track && tracks.includes(s.track) ? s.track : tracks[0]) ===
                      trackName
                  );

                  return (
                    <div key={trackName} className="relative h-full px-2.5">
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

                        const isShort = durationMins <= 30;

                        return (
                          <div
                            key={s.id}
                            style={{
                              top: `${topPx + 6}px`,
                              height: `${Math.max(heightPx - 12, 110)}px`,
                            }}
                            className="group absolute inset-x-2 z-10 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition-all duration-300 hover:z-30 hover:scale-[1.02] hover:shadow-2xl dark:border-white/15 dark:bg-zinc-900"
                          >
                            <Link
                              href={`/e/${event.slug}/sessions/${s.id}`}
                              className="flex h-full flex-col min-h-0"
                            >
                              {/* 告知バナー画像エリア */}
                              <div
                                className={`relative w-full overflow-hidden bg-zinc-950 shrink-0 ${
                                  isShort ? "h-16" : "aspect-[16/9]"
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={bannerUrl}
                                  alt={s.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute top-2 left-2 rounded-full bg-black/75 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                                  {timeFmt.format(s.startsAt)} – {timeFmt.format(s.endsAt)} ({durationMins}分)
                                </div>
                                {s.capacity != null && (
                                  <div className="absolute top-2 right-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                                        s.reservedCount >= s.capacity
                                          ? "bg-red-600 text-white"
                                          : "bg-black/75 text-white backdrop-blur-md"
                                      }`}
                                    >
                                      {s.reservedCount >= s.capacity
                                        ? "満席"
                                        : `残り${s.capacity - s.reservedCount}席`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* セッションテキスト */}
                              <div className="flex flex-1 flex-col justify-between p-3.5 min-h-0">
                                <div>
                                  <h4 className="text-sm font-black leading-snug tracking-tight text-zinc-900 group-hover:underline dark:text-white line-clamp-2">
                                    {s.title}
                                  </h4>

                                  {!isShort && s.description && (
                                    <p
                                      className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${t.muted}`}
                                    >
                                      {s.description}
                                    </p>
                                  )}
                                </div>

                                {sessionSpeakers.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-white/10">
                                    {sessionSpeakers.map((sp) => (
                                      <div
                                        key={sp.id}
                                        className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0.5 pr-2 pl-0.5 text-[10px] font-bold dark:border-white/10 dark:bg-zinc-800"
                                      >
                                        {sp.photoUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={sp.photoUrl}
                                            alt={sp.name}
                                            className="h-4 w-4 rounded-full object-cover"
                                          />
                                        ) : (
                                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300 text-[8px] font-black">
                                            {sp.name.charAt(0)}
                                          </span>
                                        )}
                                        <span>{sp.name}</span>
                                      </div>
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

            const trackName = s.track || tracks[0];
            const trackColor = getTrackColor(trackName);

            return (
              <li key={s.id} className="group py-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                  {/* 時間・トラック情報 (ステージごとに割り当てられたカラーのバッジ) */}
                  <div className="w-36 shrink-0">
                    <p className="font-mono text-xl font-black tabular-nums leading-none">
                      {timeFmt.format(s.startsAt)}
                    </p>
                    <p className={`mt-1 font-mono text-xs font-bold tabular-nums ${t.muted}`}>
                      – {timeFmt.format(s.endsAt)}
                    </p>
                    {trackName && (
                      <span
                        className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm"
                        style={{ backgroundColor: trackColor }}
                      >
                        {trackName}
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

                  {/* セッションバナー画像 */}
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
