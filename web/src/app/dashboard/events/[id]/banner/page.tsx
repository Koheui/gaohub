"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ui } from "@/lib/ui";

type BannerSize = "wide" | "square" | "story";

const SIZE_OPTIONS: { id: BannerSize; label: string; use: string; width: number; height: number }[] = [
  { id: "wide", label: "Wide", use: "X / OGP / note", width: 1200, height: 630 },
  { id: "square", label: "Square", use: "Instagram投稿", width: 1080, height: 1080 },
  { id: "story", label: "Story", use: "Instagram / X ストーリー", width: 1080, height: 1920 },
];

export default function BannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selected, setSelected] = useState<BannerSize>("wide");
  const [downloading, setDownloading] = useState(false);
  // プレビューを強制更新するためのキャッシュバスター(コンテンツ変更後の再取得用)
  const [refreshKey, setRefreshKey] = useState(0);

  const option = SIZE_OPTIONS.find((o) => o.id === selected)!;
  const previewUrl = `/api/banner/${id}?size=${selected}&v=${refreshKey}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/banner/${id}?size=${selected}&download=1`);
      if (!res.ok) throw new Error("生成に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${selected}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("バナーの生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDownloading(false);
    }
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
            タイトル・日時・会場・登壇者の顔写真から、告知用バナーを自動生成します。コンテンツ(セッション・登壇者)を更新すると内容も自動で更新されます。
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className={ui.btnText}
          title="コンテンツを更新した後はここで再読み込みできます"
        >
          再読み込み
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
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
