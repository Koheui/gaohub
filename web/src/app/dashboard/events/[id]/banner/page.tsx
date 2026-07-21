"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";
import type { SessionDoc, SpeakerDoc } from "@/lib/types";
import { ui } from "@/lib/ui";

type BannerSize = "wide" | "square" | "story";
type BannerStyle =
  | "workandrole"
  | "classic"
  | "duotone"
  | "geo"
  | "type-heavy"
  | "monochrome-minimal"
  | "split-duotone"
  | "timetable";
type Target = "event" | string;

const SIZE_OPTIONS: { id: BannerSize; label: string; use: string; width: number; height: number }[] = [
  { id: "wide", label: "Wide", use: "X / OGP / note", width: 1200, height: 630 },
  { id: "square", label: "Square", use: "Instagram投稿", width: 1080, height: 1080 },
  { id: "story", label: "Story", use: "Instagram / X ストーリー", width: 1080, height: 1920 },
];

const EVENT_STYLE_OPTIONS: { id: BannerStyle; label: string; desc: string }[] = [
  { id: "classic", label: "クラシック", desc: "LPと同じグラデーション地" },
  { id: "timetable", label: "タイムテーブル", desc: "プログラム表(セッション一覧と連動)" },
];

const SESSION_STYLE_OPTIONS: { id: BannerStyle; label: string; desc: string }[] = [
  { id: "classic", label: "クラシック (標準)", desc: "LPと同じグラデーション地 × 清涼なレイアウト" },
  { id: "workandrole", label: "WORK AND ROLE", desc: "登壇者切り抜き × タイトル" },
  { id: "duotone", label: "デュオトーン", desc: "紙地 × 写真にカラーを重ねる" },
  { id: "geo", label: "ジオメトリック", desc: "全面写真 × 斜めのカラーブロック" },
  { id: "type-heavy", label: "タイポポスター", desc: "写真を暗く敷き × 巨大タイトル" },
  { id: "monochrome-minimal", label: "モノクロ・ミニマル", desc: "白地 × 黒フレーム × 端正なグリッド" },
  { id: "split-duotone", label: "スプリット2色", desc: "左右2色分割 × 写真を染める" },
];

async function processRemoveBackground(file: File, isMonochrome: boolean): Promise<File> {
  const imgly = await import("@imgly/background-removal");
  const removeFn = imgly.removeBackground || imgly.default;
  const transparentBlob = await removeFn(file);

  if (!isMonochrome) {
    return new File([transparentBlob], file.name.replace(/\.[^/.]+$/, "") + "_nobg.png", {
      type: "image/png",
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(
          new File([transparentBlob], file.name.replace(/\.[^/.]+$/, "") + "_nobg.png", {
            type: "image/png",
          })
        );
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "grayscale(100%) contrast(115%) brightness(102%)";
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          return resolve(
            new File([transparentBlob], file.name.replace(/\.[^/.]+$/, "") + "_nobg.png", {
              type: "image/png",
            })
          );
        }
        resolve(
          new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_nobg_mono.png", {
            type: "image/png",
          })
        );
      }, "image/png");
    };
    img.onerror = () =>
      resolve(
        new File([transparentBlob], file.name.replace(/\.[^/.]+$/, "") + "_nobg.png", {
          type: "image/png",
        })
      );
    img.src = URL.createObjectURL(transparentBlob);
  });
}

export default function BannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerDoc[]>([]);
  const [target, setTarget] = useState<Target>("event");
  const [selected, setSelected] = useState<BannerSize>("wide");
  const [bannerStyle, setBannerStyle] = useState<BannerStyle>("classic");
  const [downloading, setDownloading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [processingSpeakerId, setProcessingSpeakerId] = useState<string | null>(null);

  useEffect(() => {
    const qSess = query(collection(db, "events", id, "sessions"), orderBy("startsAt", "asc"));
    const unsubSess = onSnapshot(qSess, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionDoc));
    });

    const qSpk = query(collection(db, "events", id, "speakers"));
    const unsubSpk = onSnapshot(qSpk, (snap) => {
      setSpeakers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SpeakerDoc));
    });

    return () => {
      unsubSess();
      unsubSpk();
    };
  }, [id]);

  const option = SIZE_OPTIONS.find((o) => o.id === selected)!;
  const isSessionTarget = target !== "event";
  const styleOptions = isSessionTarget ? SESSION_STYLE_OPTIONS : EVENT_STYLE_OPTIONS;
  const effectiveStyle = styleOptions.some((o) => o.id === bannerStyle) ? bannerStyle : isSessionTarget ? "workandrole" : "classic";
  const basePath = isSessionTarget ? `/api/banner/${id}/sessions/${target}` : `/api/banner/${id}`;
  const styleQuery = `&style=${effectiveStyle}`;
  const previewUrl = `${basePath}?size=${selected}${styleQuery}&v=${refreshKey}`;
  const activeSession = isSessionTarget ? sessions.find((s) => s.id === target) : null;
  const fileLabel = !isSessionTarget
    ? "event"
    : (activeSession?.title ?? "session").replace(/[^\p{L}\p{N}\-_]+/gu, "-");

  // 対象セッションの登壇者一覧
  const activeSessionSpeakers = isSessionTarget && activeSession
    ? speakers.filter((sp) => (activeSession.speakerIds ?? []).includes(sp.id))
    : [];

  async function handleDownload() {
    setDownloading(true);
    try {
      const downloadApiUrl = `${basePath}?size=${selected}${styleQuery}&download=1`;
      const res = await fetch(downloadApiUrl);
      if (!res.ok) {
        const fallbackRes = await fetch(previewUrl);
        if (!fallbackRes.ok) throw new Error("生成に失敗しました");
        const blob = await fallbackRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `banner-${fileLabel}-${selected}.png`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
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

  // 生成されたバナーをセッション告知バナーとしてワンクリックで直通連動保存
  async function handleApplyBanner() {
    if (!isSessionTarget) return;
    setApplying(true);
    setBannerError(null);
    try {
      const res = await fetch(previewUrl);
      if (!res.ok) throw new Error("バナー生成画像の取得に失敗しました");
      const blob = await res.blob();
      const file = new File([blob], `banner-${target}-${selected}.png`, { type: "image/png" });

      const url = await uploadEventImage(id, file, "session-banner");
      await updateDoc(doc(db, "events", id, "sessions", target), { customBannerUrl: url });
      setRefreshKey((k) => k + 1);
      alert("✨ このバナーをセッション告知バナーとして本番保存・連動しました！");
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "バナー連動保存に失敗しました");
    } finally {
      setApplying(false);
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

  // バナーページ内でその場登壇者写真のAI背景削除(透過PNG)・差し替え処理
  async function handleSpeakerPhotoAiProcess(speakerId: string, file: File) {
    setProcessingSpeakerId(speakerId);
    setBannerError(null);
    try {
      const transparentMonoFile = await processRemoveBackground(file, true);
      const url = await uploadEventImage(id, transparentMonoFile, "speaker");
      await updateDoc(doc(db, "events", id, "speakers", speakerId), { photoUrl: url });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "AI背景切抜き処理に失敗しました");
    } finally {
      setProcessingSpeakerId(null);
    }
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className={ui.label}>Banner Generator & Direct Sync</p>
          <h1 className={`mt-2 ${ui.h1}`}>バナー</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-zinc-600">
            イベント全体だけでなく、セッション(コンテンツ)ごとの告知バナーを全自動作成・ワンクリック直通連動できます。
            登壇者のAI背景除去(透過PNG)もこの画面で即座に行えます。
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
      </div>

      {/* セッション選択時：登壇者写真のAI背景除去(透過PNG)管理パネル */}
      {isSessionTarget && activeSessionSpeakers.length > 0 && (
        <div className="mt-6 border-2 border-purple-200 bg-purple-50/50 p-5 rounded-2xl">
          <label className="text-xs font-black uppercase tracking-wider text-purple-900">
            ✨ 登壇者写真のAI背景除去(透過PNG) ＆ バナー連動
          </label>
          <p className="mt-1 text-xs text-purple-700">
            不揃いな背景の登壇者写真をAIで自動切抜き(透過PNG ＋ モノクロ化)して、バナー内に大迫力で掲載できます。
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {activeSessionSpeakers.map((sp) => (
              <div
                key={sp.id}
                className="flex items-center gap-3 rounded-xl border border-purple-200 bg-white p-3 shadow-sm"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-900 border border-zinc-200">
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {sp.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">{sp.name}</p>
                  <label className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-700">
                    <span>
                      {processingSpeakerId === sp.id ? "AI切抜き中…" : "AI背景削除(透過PNG) 🪄"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={processingSpeakerId === sp.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSpeakerPhotoAiProcess(sp.id, f);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSessionTarget && (
        <div className="mt-6">
          <label className={ui.label}>カスタムバナー(任意画像)</label>
          <div className="mt-2 flex items-center gap-4">
            <label className="relative block h-20 w-36 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:border-zinc-400">
              {activeSession?.customBannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeSession.customBannerUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                  {uploadingBanner ? "…" : "手動で画像をアップロード"}
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
                className="text-xs text-zinc-500 underline hover:text-red-600"
              >
                削除して自動生成に戻す
              </button>
            )}
          </div>
          {bannerError && <p className="mt-2 text-sm text-red-600">{bannerError}</p>}
        </div>
      )}

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

      <div className={`mt-6 flex items-center justify-center overflow-hidden bg-zinc-100 p-6 ${ui.card}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={previewUrl}
          src={previewUrl}
          alt="バナープレビュー"
          className="max-h-[70vh] w-auto max-w-full object-contain shadow-lg"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {/* ワンクリック直通保存・連動ボタン */}
        {isSessionTarget && (
          <button
            onClick={handleApplyBanner}
            disabled={applying}
            className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {applying ? "本番適用中…" : "このバナーをセッション告知バナーに連動保存 🚀"}
          </button>
        )}

        <button onClick={handleDownload} disabled={downloading} className={ui.btn}>
          {downloading ? "生成中…" : `${option.label} をダウンロード 📥`}
        </button>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">
          PNG ・ {option.width}×{option.height}px
        </p>
      </div>
    </div>
  );
}
