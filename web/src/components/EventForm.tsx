"use client";

import { useState } from "react";
import type { EventDoc, EventTemplate } from "@/lib/types";
import { ui } from "@/lib/ui";

export interface EventFormValues {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  themeColor: string;
  template: EventTemplate;
  ghostText: string;
  showGhostText: boolean;
  showMarquee: boolean;
  statsStyle: "classic" | "poster";
  loungeEnabled: boolean;
  loungeAccess: "all" | "paid";
  loungeCategories: string[];
  venueName: string;
  venueAddress: string;
  startsAtLocal: string; // datetime-local value
  endsAtLocal: string;
}

const TEMPLATES: { id: EventTemplate; name: string; desc: string; swatch: string }[] = [
  {
    id: "kodak",
    name: "Kodak",
    desc: "紙 × グラデーション × グレイン",
    swatch: "linear-gradient(150deg, #f6f5f2 25%, #fb4f14 100%)",
  },
  {
    id: "spectrum",
    name: "Spectrum",
    desc: "グレー × 色彩グラデーション",
    swatch:
      "radial-gradient(circle at 85% 10%, #ff3d00cc 0%, transparent 50%), radial-gradient(circle at 55% 45%, #ff9100b0 0%, transparent 50%), radial-gradient(circle at 25% 75%, #ffd600a0 0%, transparent 50%), radial-gradient(circle at 0% 110%, #00c85390 0%, transparent 55%), #a1a19c",
  },
  {
    id: "aurora",
    name: "Aurora",
    desc: "メッシュグラデーション × ソフト",
    swatch:
      "radial-gradient(circle at 20% 30%, #22d3ee 0%, transparent 55%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 55%), radial-gradient(circle at 60% 90%, #34d399 0%, transparent 55%), #eef2ff",
  },
];

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function eventToFormValues(ev?: EventDoc): EventFormValues {
  return {
    title: ev?.title ?? "",
    slug: ev?.slug ?? "",
    tagline: ev?.tagline ?? "",
    description: ev?.description ?? "",
    themeColor: ev?.themeColor ?? "#18181b",
    template: ev?.template ?? "kodak",
    ghostText: ev?.ghostText ?? "",
    showGhostText: ev?.showGhostText ?? true,
    showMarquee: ev?.showMarquee ?? true,
    statsStyle: ev?.statsStyle ?? "classic",
    loungeEnabled: ev?.loungeEnabled ?? false,
    loungeAccess: ev?.loungeAccess ?? "all",
    loungeCategories: ev?.loungeCategories ?? [],
    venueName: ev?.venueName ?? "",
    venueAddress: ev?.venueAddress ?? "",
    startsAtLocal: ev?.startsAt ? toLocalInput(ev.startsAt.toDate()) : "",
    endsAtLocal: ev?.endsAt ? toLocalInput(ev.endsAt.toDate()) : "",
  };
}

const label = ui.label;
const input = ui.input;

export function EventForm({
  initial,
  submitLabel,
  onSubmit,
  slugEditable = true,
}: {
  initial: EventFormValues;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  slugEditable?: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name || values.loungeCategories.includes(name)) return;
    set("loungeCategories", [...values.loungeCategories, name]);
    setNewCategory("");
  }

  function removeCategory(name: string) {
    set(
      "loungeCategories",
      values.loungeCategories.filter((c) => c !== name)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(values.endsAtLocal) <= new Date(values.startsAtLocal)) {
      setError("終了日時は開始日時より後にしてください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div>
        <label className={label}>イベント名 *</label>
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className={input}
          placeholder="例: Future Tech Conference 2026"
        />
      </div>
      <div>
        <label className={label}>URLスラッグ *</label>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-sm text-zinc-400">/e/</span>
          <input
            required
            disabled={!slugEditable}
            pattern="[a-z0-9\-]{3,50}"
            title="半角英小文字・数字・ハイフン 3〜50文字"
            value={values.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
            placeholder="future-tech-2026"
          />
        </div>
      </div>
      <div>
        <label className={label}>キャッチコピー</label>
        <input
          value={values.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          className={input}
          placeholder="例: テクノロジーとクリエイティブの最前線へ。"
        />
        <p className="mt-1 text-xs text-zinc-400">LPのヒーローでタイトルとともにアニメーション表示されます</p>
      </div>
      <div>
        <label className={label}>説明</label>
        <textarea
          rows={6}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={input}
          placeholder="イベントの概要、対象者、プログラムなど"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>開始日時 *</label>
          <input
            required
            type="datetime-local"
            value={values.startsAtLocal}
            onChange={(e) => set("startsAtLocal", e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className={label}>終了日時 *</label>
          <input
            required
            type="datetime-local"
            value={values.endsAtLocal}
            onChange={(e) => set("endsAtLocal", e.target.value)}
            className={input}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>会場名</label>
          <input
            value={values.venueName}
            onChange={(e) => set("venueName", e.target.value)}
            className={input}
            placeholder="例: 東京国際フォーラム"
          />
        </div>
        <div>
          <label className={label}>会場住所</label>
          <input
            value={values.venueAddress}
            onChange={(e) => set("venueAddress", e.target.value)}
            className={input}
          />
        </div>
      </div>
      <div>
        <label className={label}>テーマカラー</label>
        <input
          type="color"
          value={values.themeColor}
          onChange={(e) => set("themeColor", e.target.value)}
          className="mt-1 h-10 w-20 cursor-pointer rounded border border-zinc-300"
        />
      </div>
      <div className="space-y-4 border-2 border-zinc-200 p-4">
        <p className={label}>LP表示設定</p>
        <div>
          <label className={label}>背景の飾り文字</label>
          <input
            value={values.ghostText}
            onChange={(e) => set("ghostText", e.target.value)}
            className={input}
            placeholder={`未入力なら開催年(例: ${values.startsAtLocal ? new Date(values.startsAtLocal).getFullYear() : new Date().getFullYear()})を表示`}
            maxLength={12}
          />
          <p className="mt-1 text-xs text-zinc-400">
            ヒーロー背景に大きく表示されるアウトライン文字です(最大12文字)
          </p>
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.showGhostText}
            onChange={(e) => set("showGhostText", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-bold">背景の飾り文字を表示する</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.showMarquee}
            onChange={(e) => set("showMarquee", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-bold">イベント名が流れる帯(マーキー)を表示する</span>
        </label>
        <div>
          <label className={label}>統計・カウントダウンの見せ方</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => set("statsStyle", "classic")}
              className={`border-2 p-3 text-left transition-colors ${
                values.statsStyle === "classic" ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <p className="text-sm font-black">クラシック {values.statsStyle === "classic" && "✓"}</p>
              <p className="mt-0.5 text-xs text-zinc-500">枠付きストリップ+黒帯カウントダウン</p>
            </button>
            <button
              type="button"
              onClick={() => set("statsStyle", "poster")}
              className={`border-2 p-3 text-left transition-colors ${
                values.statsStyle === "poster" ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <p className="text-sm font-black">ポスター数字 {values.statsStyle === "poster" && "✓"}</p>
              <p className="mt-0.5 text-xs text-zinc-500">枠なし特大数字(塗り/アウトライン混合)</p>
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-4 border-2 border-zinc-200 p-4">
        <p className={label}>コミュニティラウンジ</p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.loungeEnabled}
            onChange={(e) => set("loungeEnabled", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-bold">
            チケット購入者向けのコミュニティラウンジを有効にする
          </span>
        </label>
        <p className="text-xs text-zinc-400">
          有効にすると、確定済みチケットを持つ参加者がチケットページから参加者一覧を閲覧し、
          メッセージを送れるようになります(自己申告制・任意参加)。
        </p>
        {values.loungeEnabled && (
          <div>
            <label className={label}>参加できる人</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  ["all", "全参加者", "無料・有料を問わず参加できます"],
                  ["paid", "有料チケットのみ", "有料チケットの購入者だけが参加できます"],
                ] as const
              ).map(([val, title, desc]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => set("loungeAccess", val)}
                  className={`border-2 p-3 text-left transition-colors ${
                    values.loungeAccess === val
                      ? "border-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-sm font-black">
                    {title} {values.loungeAccess === val && "✓"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {values.loungeEnabled && (
          <div>
            <label className={label}>参加者カテゴリ</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {values.loungeCategories.length === 0 && (
                <p className="text-xs text-zinc-400">
                  例: 運営者・投資家・支援者・スタートアップ など、自由に追加してください
                </p>
              )}
              {values.loungeCategories.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-3 pr-1.5 text-xs font-bold"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCategory(c)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-300 hover:text-zinc-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                className={`${input} mt-0`}
                placeholder="例: 投資家"
                maxLength={20}
              />
              <button type="button" onClick={addCategory} className={ui.btnGhost}>
                追加
              </button>
            </div>
          </div>
        )}
      </div>
      <div>
        <label className={label}>LPテンプレート</label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => set("template", t.id)}
              className={`overflow-hidden rounded-xl border-2 text-left transition-colors ${
                values.template === t.id
                  ? "border-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <div className="h-16 w-full" style={{ background: t.swatch }} />
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">
                  {t.name}
                  {values.template === t.id && " ✓"}
                </p>
                <p className="text-xs text-zinc-500">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className={ui.btn}
      >
        {submitLabel}
      </button>
    </form>
  );
}
