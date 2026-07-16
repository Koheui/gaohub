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
import type { SessionDoc, SpeakerDoc } from "@/lib/types";
import { ui } from "@/lib/ui";

const label = ui.label;
const input = ui.input;

interface SessionDraft {
  title: string;
  description: string;
  track: string;
  startsAtLocal: string;
  endsAtLocal: string;
  speakerIds: string[];
}

const emptyDraft: SessionDraft = {
  title: "",
  description: "",
  track: "",
  startsAtLocal: "",
  endsAtLocal: "",
  speakerIds: [],
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

function SpeakerChip({ speaker }: { speaker: SpeakerDoc }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pl-0.5 pr-2.5 text-xs">
      {speaker.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={speaker.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-[10px] text-white">
          {speaker.name.charAt(0)}
        </span>
      )}
      {speaker.name}
    </span>
  );
}

function SessionForm({
  eventId,
  initial,
  speakers,
  sessionId,
  onDone,
  onCancel,
}: {
  eventId: string;
  initial: SessionDraft;
  speakers: SpeakerDoc[];
  sessionId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SessionDraft>(key: K, value: SessionDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleSpeaker(id: string) {
    set(
      "speakerIds",
      draft.speakerIds.includes(id)
        ? draft.speakerIds.filter((s) => s !== id)
        : [...draft.speakerIds, id]
    );
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
        speakerIds: draft.speakerIds,
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
      className="space-y-4 border-2 border-zinc-950 bg-white p-6"
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
        <label className={label}>登壇者(クリックで選択)</label>
        {speakers.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            登壇者が未登録です。
            <Link href={`/dashboard/events/${eventId}/speakers`} className="underline">
              登壇者ページ
            </Link>
            から登録してください。
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {speakers.map((sp) => {
              const selected = draft.speakerIds.includes(sp.id);
              return (
                <button
                  type="button"
                  key={sp.id}
                  onClick={() => toggleSpeaker(sp.id)}
                  className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm ${
                    selected
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white hover:border-zinc-500"
                  }`}
                >
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-300 text-xs text-white">
                      {sp.name.charAt(0)}
                    </span>
                  )}
                  {sp.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className={ui.btn}
        >
          {sessionId ? "保存" : "追加する"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={ui.btnGhost}
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
  const [speakers, setSpeakers] = useState<SpeakerDoc[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events", id, "sessions"), orderBy("startsAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SessionDoc));
    });
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, "events", id, "speakers"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSpeakers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SpeakerDoc));
    });
  }, [id]);

  const speakerById = new Map(speakers.map((s) => [s.id, s]));

  async function handleDelete(sessionId: string) {
    if (!confirm("このセッションを削除しますか?")) return;
    await deleteDoc(doc(db, "events", id, "sessions", sessionId));
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className={ui.h1}>コンテンツ(セッション)</h1>
          <p className="mt-1 text-sm text-zinc-500">
            登録したセッションは公開LPのタイムテーブルに自動で反映されます
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className={ui.btn}
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
            speakers={speakers}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {sessions === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : sessions.length === 0 && !adding ? (
        <div className="mt-8 border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center">
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
                  speakers={speakers}
                  initial={{
                    title: s.title,
                    description: s.description,
                    track: s.track,
                    startsAtLocal: toLocalInput(s.startsAt.toDate()),
                    endsAtLocal: toLocalInput(s.endsAt.toDate()),
                    speakerIds: s.speakerIds ?? [],
                  }}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-start justify-between border-2 border-zinc-950 bg-white p-5"
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
                    {(s.speakerIds ?? []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(s.speakerIds ?? []).map((sid) => {
                          const sp = speakerById.get(sid);
                          return sp ? <SpeakerChip key={sid} speaker={sp} /> : null;
                        })}
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
