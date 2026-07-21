"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";
import type { SessionDoc } from "@/lib/types";
import { ui } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

type BannerSize = "wide" | "square" | "story";
type BannerStyle = "classic" | "duotone" | "geo" | "timetable";
/** "event" = イベント全体のバナー。それ以外はセッションID */
type Target = "event" | string;

const SIZE_OPTIONS: { id: BannerSize; label: string; use: string; width: number; height: number }[] = [
  { id: "wide", label: "Wide", use: "X / OGP / note", width: 1200, height: 630 },
  { id: "square", label: "Square", use: "Instagram投稿", width: 1080, height: 1080 },
  { id: "story", label: "Story", use: "Instagram / X ストーリー", width: 1080, height: 1920 },
];

/** 対象ごとに選べるデザインパターン */
const EVENT_STYLE_OPTIONS: { id: BannerStyle; label: string; desc: string }[] = [
  { id: "classic", label: "クラシック", desc: "LPと同じグラデーション地" },
  { id: "timetable", label: "タイムテーブル", desc: "プログラム表(セッション一覧と連動)" },
];

const SESSION_STYLE_OPTIONS: { id: BannerStyle; label: string; desc: string }[] = [
  { id: "classic", label: "クラシック", desc: "LPと同じグラデーション地" },
  { id: "duotone", label: "デュオトーン", desc: "紙地 × 写真にカラーを重ねる" },
  { id: "geo", label: "ジオメトリック", desc: "全面写真 × 斜めのカラーブロック" },
];

export default function BannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [target, setTarget] = useState<Target>("event");
  const [selected, setSelected] = useState<BannerSize>("wide");
  const [bannerStyle, setBannerStyle] = useState<BannerStyle>("classic");
  const [downloading, setDownloading] = useState(false);
  // プレビューを強制更新するためのキャッシュバスター(コンテンツ変更後の再取得用)
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events", id, "sessions"), orderBy("startsAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionDoc));
    });
  }, [id]);

  const option = SIZE_OPTIONS.find((o) => o.id === selected)!;
  const isSessionTarget = target !== "event";
  const styleOptions = isSessionTarget ? SESSION_STYLE_OPTIONS : EVENT_STYLE_OPTIONS;
  // 対象を切り替えた際、選べないスタイルが残っていたらクラシックに戻す
  const effectiveStyle = styleOptions.some((o) => o.id === bannerStyle) ? bannerStyle : "classic";
  const basePath = isSessionTarget ? `/api/banner/${id}/sessions/${target}` : `/api/banner/${id}`;
  const styleQuery = `&style=${effectiveStyle}`;
  const previewUrl = `${basePath}?size=${selected}${styleQuery}&v=${refreshKey}`;
  const activeSession = isSessionTarget ? sessions.find((s) => s.id === target) : null;
  const fileLabel = !isSessionTarget
    ? "event"
    : (activeSession?.title ?? "session").replace(/[^\p{L}\p{N}\-_]+/gu, "-");

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`${basePath}?size=${selected}${styleQuery}&download=1`);
      if (!res.ok) throw new Error("生成に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${fileLabel}-${selected}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("バナーの生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDownloading(false);
    }
  }

  async function handleBannerUpload(file: File | undefined) {
    if (!file || !isSessionTarget) return;
    setUploadingBanner(true);
    setBannerError(null);
    try {
      const url = await uploadEventImage(id, file, "session-banner");
      await updateDoc(doc(db, "events", id, "sessions", target), { customBannerUrl: url });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleRemoveBanner() {
    if (!isSessionTarget) return;
    await updateDoc(doc(db, "events", id, "sessions", target), { customBannerUrl: null });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className={ui.label}>Banner Generator</p>
          <h1 className={`mt-2 ${ui.h1}`}>バナー</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-zinc-600">
            イベント全体だけでなく、セッション(コンテンツ)ごとにも告知バナーを自動生成できます。
            登壇者の顔写真は登壇者ページでアップロードすると、そのままバナーに反映されます。
          </p>
        </div>
        <div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className={ui.btnText}
            title="コンテンツを更新した後はここで再読み込みできます"
          >
            再読み込み
          </button>
        </div>
      </div>

      <div className="mt-8">
        <label className={ui.label}>対象</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setTarget("event")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              target === "event" ? "bg-zinc-950 text-white" : `${ui.card} hover:bg-zinc-100`
            }`}
          >
            イベント全体
          </button>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setTarget(s.id)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${
                target === s.id ? "bg-zinc-950 text-white" : `${ui.card} hover:bg-zinc-100`
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        {sessions.length === 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            セッションを登録すると、コンテンツごとのバナーもここから作れます。
          </p>
        )}
      </div>

      {isSessionTarget && (
        <div className="mt-6">
          <label className={ui.label}>カスタムバナー(任意)</label>
          <p className="mt-1 text-xs text-zinc-500">
            自動生成の代わりに、独自にデザインしたバナー画像をアップロードして使うこともできます。
          </p>
          <div className="mt-3 flex items-center gap-4">
            <label className="relative block h-24 w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:border-zinc-400">
              {activeSession?.customBannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeSession.customBannerUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                  {uploadingBanner ? "アップロード中…" : "クリックして画像を選択"}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingBanner}
                onChange={(e) => handleBannerUpload(e.target.files?.[0])}
              />
            </label>
            {activeSession?.customBannerUrl && (
              <button
                onClick={handleRemoveBanner}
                className="text-sm text-zinc-500 underline hover:text-red-600"
              >
                削除して自動生成に戻す
              </button>
            )}
          </div>
          {bannerError && <p className="mt-2 text-sm text-red-600">{bannerError}</p>}
        </div>
      )}

      {activeSession?.customBannerUrl ? (
        <p className="mt-6 text-xs text-zinc-500">
          カスタムバナーが設定されているため、デザイン/サイズの選択は無効です
          (アップロードした画像がそのままダウンロードされます)。
        </p>
      ) : (
        <>
          <div className="mt-6">
            <label className={ui.label}>デザイン</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {styleOptions.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setBannerStyle(o.id)}
                  className={`px-5 py-3 text-left transition-colors ${
                    effectiveStyle === o.id ? "bg-zinc-950 text-white" : `${ui.card} hover:bg-zinc-100`
                  }`}
                >
                  <p className="text-sm font-black tracking-tight">{o.label}</p>
                  <p
                    className={`mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${
                      effectiveStyle === o.id ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {o.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {SIZE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className={`px-5 py-3 text-left transition-colors ${
                  selected === o.id ? "bg-zinc-950 text-white" : `${ui.card} hover:bg-zinc-100`
                }`}
              >
                <p className="text-sm font-black tracking-tight">{o.label}</p>
                <p
                  className={`mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${
                    selected === o.id ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  {o.width}×{o.height} ・ {o.use}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      <div className={`mt-6 flex items-center justify-center overflow-hidden bg-zinc-100 p-6 ${ui.card}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={previewUrl}
          src={previewUrl}
          alt="バナープレビュー"
          className="max-h-[70vh] w-auto max-w-full object-contain shadow-lg"
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={handleDownload} disabled={downloading} className={ui.btn}>
          {downloading ? "生成中…" : `${option.label} をダウンロード →`}
        </button>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
          PNG ・ {option.width}×{option.height}px
        </p>
      </div>
    </div>
  );
}
