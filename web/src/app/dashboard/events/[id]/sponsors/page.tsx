"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";
import type { EventDoc, SponsorDoc } from "@/lib/types";
import { ui } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

const label = ui.label;
const input = ui.input;

interface SponsorDraft {
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  tier: string;
}

const emptyDraft: SponsorDraft = { name: "", logoUrl: null, websiteUrl: "", tier: "" };

function TierManager({ eventId, tiers }: { eventId: string; tiers: string[] }) {
  const [newTier, setNewTier] = useState("");

  async function save(next: string[]) {
    await updateDoc(doc(db, "events", eventId), { sponsorTiers: next });
  }

  function addTier() {
    const name = newTier.trim();
    if (!name || tiers.includes(name)) return;
    save([...tiers, name]);
    setNewTier("");
  }

  function removeTier(name: string) {
    save(tiers.filter((t) => t !== name));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...tiers];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  }

  return (
    <div className={`mt-6 p-4 ${ui.card}`}>
      <p className={ui.label}>スポンサー階層(優劣)</p>
      <p className="mt-1 text-xs text-zinc-500">
        上にあるほど上位の階層としてLPに大きく表示されます。矢印で順序を入れ替えられます。
      </p>
      {tiers.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-400">
          まだ階層が登録されていません(例: プラチナ / ゴールド / シルバー)。
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {tiers.map((t, i) => (
            <li
              key={t}
              className="flex items-center justify-between gap-3 rounded bg-zinc-50 px-3 py-1.5 text-sm"
            >
              <span className="font-bold">
                <span className="mr-2 font-mono text-xs text-zinc-400">#{i + 1}</span>
                {t}
              </span>
              <span className="flex items-center gap-2">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                  title="上へ"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === tiers.length - 1}
                  className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                  title="下へ"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeTier(t)}
                  className="text-xs text-zinc-400 hover:text-red-600"
                >
                  削除
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={newTier}
          onChange={(e) => setNewTier(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTier();
            }
          }}
          className={`${input} mt-0 max-w-xs`}
          placeholder="例: プラチナ"
          maxLength={20}
        />
        <button type="button" onClick={addTier} className={ui.btnGhost}>
          追加
        </button>
      </div>
    </div>
  );
}

function SponsorForm({
  eventId,
  initial,
  tiers,
  sponsorId,
  onDone,
  onCancel,
}: {
  eventId: string;
  initial: SponsorDraft;
  tiers: string[];
  sponsorId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SponsorDraft>(key: K, value: SponsorDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("logoUrl", await uploadEventImage(eventId, file, "sponsor"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (sponsorId) {
        await updateDoc(doc(db, "events", eventId, "sponsors", sponsorId), { ...draft });
      } else {
        await addDoc(collection(db, "events", eventId, "sponsors"), {
          ...draft,
          createdAt: serverTimestamp(),
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-2 border-zinc-950 bg-white p-6">
      <div className="flex items-start gap-5">
        <label className="relative block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:border-zinc-400">
          {draft.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.logoUrl} alt="" className="h-full w-full object-contain p-2" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              {uploading ? "…" : "ロゴを選択"}
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogo(e.target.files?.[0])}
          />
        </label>
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>企業・団体名 *</label>
            <input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Webサイト</label>
            <input
              type="url"
              value={draft.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              className={input}
              placeholder="https://"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>階層</label>
            <select value={draft.tier} onChange={(e) => set("tier", e.target.value)} className={input}>
              <option value="">未選択</option>
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy || uploading} className={ui.btn}>
          {sponsorId ? "保存" : "追加する"}
        </button>
        <button type="button" onClick={onCancel} className={ui.btnGhost}>
          キャンセル
        </button>
      </div>
    </form>
  );
}

export default function SponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [sponsors, setSponsors] = useState<SponsorDoc[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "events", id), (snap) => {
      setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as EventDoc) : null);
    });
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, "events", id, "sponsors"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSponsors(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SponsorDoc));
    });
  }, [id]);

  const tiers = event?.sponsorTiers ?? [];

  async function handleDelete(sponsorId: string) {
    if (!confirm("このスポンサーを削除しますか?")) return;
    await deleteDoc(doc(db, "events", id, "sponsors", sponsorId));
  }

  const grouped = (sponsors ?? []).slice().sort((a, b) => {
    const ai = tiers.indexOf(a.tier);
    const bi = tiers.indexOf(b.tier);
    return (ai === -1 ? tiers.length : ai) - (bi === -1 ? tiers.length : bi);
  });

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className={ui.h1}>スポンサー</h1>
          <p className="mt-1 text-sm text-zinc-500">
            登録したスポンサーは公開LPのスポンサーセクションに階層順で表示されます。
          </p>
        </div>
        {!adding && (
          <div className="flex items-center gap-3">
            <ViewPublicPageButton eventId={id} />
            <button onClick={() => setAdding(true)} className={ui.btn}>
              + スポンサーを追加
            </button>
          </div>
        )}
      </div>

      <TierManager eventId={id} tiers={tiers} />

      {adding && (
        <div className="mt-6">
          <SponsorForm
            eventId={id}
            initial={emptyDraft}
            tiers={tiers}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {sponsors === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : sponsors.length === 0 && !adding ? (
        <div className="mt-8 border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center">
          <p className="text-zinc-500">まだスポンサーが登録されていません。</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {grouped.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <SponsorForm
                  eventId={id}
                  sponsorId={s.id}
                  tiers={tiers}
                  initial={{
                    name: s.name,
                    logoUrl: s.logoUrl,
                    websiteUrl: s.websiteUrl ?? "",
                    tier: s.tier ?? "",
                  }}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-center justify-between border-2 border-zinc-950 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 font-bold text-white">
                      {s.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {s.tier || "階層未選択"}
                      {s.websiteUrl && (
                        <>
                          {" "}
                          ・{" "}
                          <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            サイト
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button onClick={() => setEditingId(s.id)} className="text-zinc-600 underline hover:text-zinc-900">
                    編集
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-zinc-400 hover:text-red-600">
                    削除
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
