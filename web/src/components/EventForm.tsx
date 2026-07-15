"use client";

import { useState } from "react";
import type { EventDoc } from "@/lib/types";

export interface EventFormValues {
  title: string;
  slug: string;
  description: string;
  themeColor: string;
  venueName: string;
  venueAddress: string;
  startsAtLocal: string; // datetime-local value
  endsAtLocal: string;
}

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
    description: ev?.description ?? "",
    themeColor: ev?.themeColor ?? "#18181b",
    venueName: ev?.venueName ?? "",
    venueAddress: ev?.venueAddress ?? "",
    startsAtLocal: ev?.startsAt ? toLocalInput(ev.startsAt.toDate()) : "",
    endsAtLocal: ev?.endsAt ? toLocalInput(ev.endsAt.toDate()) : "",
  };
}

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

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

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
