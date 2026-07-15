"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";
import type { SessionDoc, Speaker } from "@/lib/types";

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

interface SpeakerDraft extends Speaker {
  uploading?: boolean;
}

interface SessionDraft {
  title: string;
  description: string;
  track: string;
  startsAtLocal: string;
  endsAtLocal: string;
  speakers: SpeakerDraft[];
}

const emptyDraft: SessionDraft = {
  title: "",
  description: "",
  track: "",
  startsAtLocal: "",
  endsAtLocal: "",
  speakers: [],
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeLabel(s: SessionDoc): string {
  const fmt = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  return `${fmt.format(s.startsAt.toDate())} – ${fmt.format(s.endsAt.toDate())}`;
}

function SessionForm({
  eventId,
  initial,
  onDone,
  onCancel,
  sessionId,
}: {
  eventId: string;
  initial: SessionDraft;
  onDone: () => void;
  onCancel: () => void;
  sessionId?: string;
}) {
  const [draft, setDraft] = useState<SessionDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SessionDraft>(key: K, value: SessionDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setSpeaker(i: number, patch: Partial<SpeakerDraft>) {
    setDraft((d) => ({
      ...d,
      speakers: d.speakers.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  }

  async function handlePhoto(i: number, file: File | undefined) {
    if (!file) return;
    setSpeaker(i, { uploading: true });
    try {
      const url = await uploadEventImage(eventId, file, "speaker");
      setSpeaker(i, { photoUrl: url, uploading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setSpeaker(i, { uploading: false });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(draft.endsAtLocal) <= new Date(draft.startsAtLocal)) {
      setError("終了時刻は開始時刻より後にしてください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = {
        title: draft.title,
        description: draft.description,
        track: draft.track,
        startsAt: Timestamp.fromDate(new Date(draft.startsAtLocal)),
        endsAt: Timestamp.fromDate(new Date(draft.endsAtLocal)),
        speakers: draft.speakers.map(({ name, title, company, photoUrl }) => ({
          name,
          title,
          company,
          photoUrl: photoUrl ?? null,
        })),
      };
      if (sessionId) {
        await updateDoc(doc(db, "events", eventId, "sessions", sessionId), data);
      } else {
        await addDoc(collection(db, "events", eventId, "sessions"), {
          ...data,
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6"
    >
      <div>
        <label className={label}>セッションタイトル *</label>
        <input
          required
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          className={input}
          placeholder="例: 生成AI時代のプロダクト戦略"
        />
      </div>
      <div>
        <label className={label}>概要</label>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          className={input}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>開始 *</label>
          <input
            required
            type="datetime-local"
            value={draft.startsAtLocal}
            onChange={(e) => set("startsAtLocal", e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className={label}>終了 *</label>
          <input
            required
            type="datetime-local"
            value={draft.endsAtLocal}
            onChange={(e) => set("endsAtLocal", e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className={label}>トラック/会場</label>
          <input
            value={draft.track}
            onChange={(e) => set("track", e.target.value)}
            className={input}
            placeholder="例: Main Stage"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={label}>登壇者</label>
          <button
            type="button"
            onClick={() =>
              set("speakers", [
                ...draft.speakers,
                { name: "", title: "", company: "", photoUrl: null },
              ])
            }
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            + 登壇者を追加
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {draft.speakers.map((sp, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
              <label className="relative block h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full bg-zinc-100">
                {sp.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sp.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                    {sp.uploading ? "…" : "写真"}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhoto(i, e.target.files?.[0])}
                />
              </label>
              <div className="grid flex-1 grid-cols-3 gap-2">
                <input
                  required
                  placeholder="氏名 *"
                  value={sp.name}
                  onChange={(e) => setSpeaker(i, { name: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm"
                />
                <input
                  placeholder="肩書き"
                  value={sp.title}
                  onChange={(e) => setSpeaker(i, { title: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm"
                />
                <input
                  placeholder="会社名"
                  value={sp.company}
                  onChange={(e) => setSpeaker(i, { company: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  set("speakers", draft.speakers.filter((_, j) => j !== i))
                }
                className="mt-2 text-zinc-400 hover:text-red-600"
                aria-label="登壇者を削除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy || draft.speakers.some((s) => s.uploading)}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {sessionId ? "保存" : "追加する"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm hover:bg-zinc-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export default function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events", id, "sessions"), orderBy("startsAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionDoc));
    });
  }, [id]);

  async function handleDelete(sessionId: string) {
    if (!confirm("このセッションを削除しますか?")) return;
    await deleteDoc(doc(db, "events", id, "sessions", sessionId));
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">コンテンツ(セッション)</h1>
          <p className="mt-1 text-sm text-zinc-500">
            登録したセッション・登壇者は公開LPのタイムテーブルに自動で反映されます
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            + セッションを追加
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-6">
          <SessionForm
            eventId={id}
            initial={emptyDraft}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {sessions === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : sessions.length === 0 && !adding ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500">
            まだセッションがありません。トークセッションや基調講演を登録しましょう。
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {sessions.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <SessionForm
                  eventId={id}
                  sessionId={s.id}
                  initial={{
                    title: s.title,
                    description: s.description,
                    track: s.track,
                    startsAtLocal: toLocalInput(s.startsAt.toDate()),
                    endsAtLocal: toLocalInput(s.endsAt.toDate()),
                    speakers: s.speakers,
                  }}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-start justify-between rounded-2xl border border-zinc-200 p-5"
              >
                <div className="flex gap-4">
                  <div className="w-28 shrink-0 text-sm tabular-nums text-zinc-500">
                    {timeLabel(s)}
                    {s.track && (
                      <span className="mt-1 block rounded-full bg-zinc-100 px-2 py-0.5 text-center text-xs text-zinc-600">
                        {s.track}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    {s.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{s.description}</p>
                    )}
                    {s.speakers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.speakers.map((sp, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pl-0.5 pr-2.5 text-xs"
                          >
                            {sp.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sp.photoUrl}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-[10px] text-white">
                                {sp.name.charAt(0)}
                              </span>
                            )}
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="text-zinc-600 underline hover:text-zinc-900"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-zinc-400 hover:text-red-600"
                  >
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
