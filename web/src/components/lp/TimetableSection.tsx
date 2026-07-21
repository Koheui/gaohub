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

  // デフォルトは本格タイムテーブル表 ('matrix')、リスト表示 ('timeline')
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

  // タイムスケジュールマトリックス構築用の時間スロット抽出 (開始時間の昇順)
  const timeSlots = useMemo(() => {
    if (currentDaySessions.length === 0) return [];
    // 全セッションの開始・終了時刻のユニークな整列リスト
    const times = new Set<number>();
    currentDaySessions.forEach((s) => {
      times.add(s.startsAt.getTime());
    });
    const sorted = Array.from(times).sort((a, b) => a - b);
    return sorted.map((tMs) => new Date(tMs));
  }, [currentDaySessions]);

  // 時間スロット x ステージ のマトリックスマップ
  const matrixData = useMemo(() => {
    // timeSlotKey -> trackName -> PublicSession[]
    const map = new Map<string, Map<string, PublicSession[]>>();

    timeSlots.forEach((slotDate) => {
      const slotKey = timeFmt.format(slotDate);
      const trackMap = new Map<string, PublicSession[]>();
      tracks.forEach((tr) => trackMap.set(tr, []));

      currentDaySessions.forEach((s) => {
        const sTimeKey = timeFmt.format(s.startsAt);
        if (sTimeKey === slotKey) {
          const tr = s.track && tracks.includes(s.track) ? s.track : tracks[0];
          const list = trackMap.get(tr) ?? [];
          list.push(s);
          trackMap.set(tr, list);
        }
      });
      map.set(slotKey, trackMap);
    });

    return map;
  }, [timeSlots, tracks, currentDaySessions]);

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
            Schedule & Timetable
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
            <span>ステージ別スケジュール表 📅</span>
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

      {/* ─── モード 1: ステージ別タイムスケジュール表 (Gantt/Matrix View) ─── */}
      {viewMode === "matrix" && (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-zinc-200/80 bg-white/70 shadow-lg dark:border-white/10 dark:bg-zinc-950/60">
          <div className="min-w-[800px]">
            {/* タイムテーブル・グリッドヘッダー (ステージ一覧) */}
            <div
              className="grid border-b border-zinc-200/80 bg-zinc-100/90 dark:border-white/10 dark:bg-zinc-900/90"
              style={{
                gridTemplateColumns: `120px repeat(${tracks.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="flex items-center justify-center border-r p-4 font-mono text-xs font-black uppercase tracking-widest text-zinc-400 border-zinc-200 dark:border-white/10">
                TIME
              </div>
              {tracks.map((trackName, tIdx) => (
                <div
                  key={trackName}
                  className="flex items-center justify-between border-r px-6 py-4 border-zinc-200 dark:border-white/10 last:border-r-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          tIdx === 0 ? color : tIdx === 1 ? "#3b82f6" : "#10b981",
                      }}
                    />
                    <span className="text-sm font-black tracking-tight">{trackName}</span>
                  </div>
                  <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    STAGE {tIdx + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* 時間スロットごとの行 (タイムライン行) */}
            <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
              {timeSlots.map((slotDate) => {
                const slotKey = timeFmt.format(slotDate);
                const trackMap = matrixData.get(slotKey);

                return (
                  <div
                    key={slotKey}
                    className="grid min-h-[160px] transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                    style={{
                      gridTemplateColumns: `120px repeat(${tracks.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {/* 左軸：時間目盛り */}
                    <div className="flex flex-col items-center justify-start border-r p-4 border-zinc-200 dark:border-white/10">
                      <span className="font-mono text-xl font-black tabular-nums tracking-tight">
                        {slotKey}
                      </span>
                      <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        START
                      </span>
                    </div>

                    {/* 各ステージのセッションセル */}
                    {tracks.map((trackName) => {
                      const sessionList = trackMap?.get(trackName) ?? [];

                      return (
                        <div
                          key={trackName}
                          className="border-r p-4 border-zinc-200 dark:border-white/10 last:border-r-0 flex flex-col justify-center"
                        >
                          {sessionList.length > 0 ? (
                            sessionList.map((s) => {
                              const sessionSpeakers = s.speakerIds
                                .map((sid) => speakerMap.get(sid))
                                .filter((sp): sp is PublicSpeaker => !!sp);
                              const bannerUrl =
                                s.customBannerUrl ||
                                `/api/banner/${event.id}/sessions/${s.id}?size=wide`;

                              return (
                                <div
                                  key={s.id}
                                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition-all duration-300 hover:scale-[1.01] hover:shadow-xl dark:border-white/15 dark:bg-zinc-900 my-1"
                                >
                                  {/* 特大告知バナー画像 */}
                                  <Link
                                    href={`/e/${event.slug}/sessions/${s.id}`}
                                    className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={bannerUrl}
                                      alt={s.title}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                    {/* 時間帯表示 */}
                                    <div className="absolute top-2.5 left-2.5 rounded-full bg-black/75 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-md">
                                      {timeFmt.format(s.startsAt)} – {timeFmt.format(s.endsAt)}
                                    </div>
                                    {/* 満席・残り表示 */}
                                    {s.capacity != null && (
                                      <div className="absolute top-2.5 right-2.5">
                                        <span
                                          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
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
                                  </Link>

                                  {/* セッションテキスト */}
                                  <div className="p-4">
                                    <Link
                                      href={`/e/${event.slug}/sessions/${s.id}`}
                                      className="group-hover:underline"
                                    >
                                      <h4 className="text-base font-black leading-snug tracking-tight">
                                        {s.title}
                                      </h4>
                                    </Link>

                                    {s.description && (
                                      <p className={`mt-2 text-xs leading-relaxed line-clamp-2 ${t.muted}`}>
                                        {s.description}
                                      </p>
                                    )}

                                    {/* 登壇者表示 */}
                                    {sessionSpeakers.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3 border-zinc-100 dark:border-white/10">
                                        {sessionSpeakers.map((sp) => (
                                          <Link
                                            key={sp.id}
                                            href={`/e/${event.slug}/speakers/${sp.id}`}
                                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 py-0.5 pr-2.5 pl-0.5 transition-all hover:bg-zinc-200/60 dark:border-white/10 dark:bg-zinc-800/60"
                                          >
                                            {sp.photoUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={sp.photoUrl}
                                                alt={sp.name}
                                                className="h-5 w-5 rounded-full object-cover"
                                              />
                                            ) : (
                                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-[9px] font-black text-zinc-800 dark:bg-zinc-700 dark:text-white">
                                                {sp.name.charAt(0)}
                                              </span>
                                            )}
                                            <span className="text-[11px] font-bold">{sp.name}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex h-full min-h-[100px] items-center justify-center rounded-xl border border-dashed border-zinc-200/60 text-xs font-bold text-zinc-400 dark:border-white/5">
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
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
