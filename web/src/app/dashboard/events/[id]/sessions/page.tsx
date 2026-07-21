"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
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
import type { EventDoc, SessionDoc, SpeakerDoc } from "@/lib/types";
import { ui } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

const label = ui.label;
const input = ui.input;

interface SessionDraft {
  title: string;
  description: string;
  track: string;
  startsAtLocal: string;
  endsAtLocal: string;
  speakerIds: string[];
  isComingSoon: boolean;
  /** 空欄 = 無制限 */
  capacityText: string;
}

const emptyDraft: SessionDraft = {
  title: "",
  description: "",
  track: "",
  startsAtLocal: "",
  endsAtLocal: "",
  speakerIds: [],
  isComingSoon: false,
  capacityText: "",
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
  tracks,
  sessionId,
  onDone,
  onCancel,
}: {
  eventId: string;
  initial: SessionDraft;
  speakers: SpeakerDoc[];
  tracks: string[];
  sessionId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSpeaker, setAddingSpeaker] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newSpeakerTitle, setNewSpeakerTitle] = useState("");
  const [newSpeakerCompany, setNewSpeakerCompany] = useState("");
  const [creatingSpeaker, setCreatingSpeaker] = useState(false);
  const [addingTrack, setAddingTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState("");
  const [creatingTrack, setCreatingTrack] = useState(false);

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

  async function createSpeaker() {
    const name = newSpeakerName.trim();
    if (!name) return;
    setCreatingSpeaker(true);
    try {
      const ref = await addDoc(collection(db, "events", eventId, "speakers"), {
        name,
        title: newSpeakerTitle.trim(),
        company: newSpeakerCompany.trim(),
        photoUrl: null,
        bio: "",
        email: "",
        websiteUrl: "",
        xUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        facebookUrl: "",
        createdAt: serverTimestamp(),
      });
      set("speakerIds", [...draft.speakerIds, ref.id]);
      setNewSpeakerName("");
      setNewSpeakerTitle("");
      setNewSpeakerCompany("");
      setAddingSpeaker(false);
    } finally {
      setCreatingSpeaker(false);
    }
  }

  async function createTrack() {
    const name = newTrackName.trim();
    if (!name) return;
    setCreatingTrack(true);
    try {
      await updateDoc(doc(db, "events", eventId), { tracks: arrayUnion(name) });
      set("track", name);
      setNewTrackName("");
      setAddingTrack(false);
    } finally {
      setCreatingTrack(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(draft.endsAtLocal) <= new Date(draft.startsAtLocal)) {
      setError("終了時刻は開始時刻より後にしてください");
      return;
    }
    const capacityText = draft.capacityText.trim();
    let capacity: number | null = null;
    if (capacityText) {
      capacity = Number(capacityText);
      if (!Number.isInteger(capacity) || capacity < 1) {
        setError("定員は1以上の整数で入力してください");
        return;
      }
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
        isComingSoon: draft.isComingSoon,
        capacity,
      };
      if (sessionId) {
        await updateDoc(doc(db, "events", eventId, "sessions", sessionId), data);
      } else {
        await addDoc(collection(db, "events", eventId, "sessions"), {
          ...data,
          reservedCount: 0,
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

      <label className="flex items-center gap-3 border-2 border-zinc-200 p-3">
        <input
          type="checkbox"
          checked={draft.isComingSoon}
          onChange={(e) => set("isComingSoon", e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm font-bold">
          Coming Soon(詳細未定として先に告知する)
        </span>
      </label>
      {draft.isComingSoon && (
        <p className="text-xs text-zinc-400">
          公開LPでは日時の代わりに「COMING SOON」と表示されます。日時は仮の値のままで構いません。
        </p>
      )}

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
          <label className={label}>会場</label>
          <select
            value={draft.track}
            onChange={(e) => set("track", e.target.value)}
            className={input}
          >
            <option value="">未選択</option>
            {Array.from(new Set(draft.track ? [draft.track, ...tracks] : tracks)).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {addingTrack ? (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className={input}
                placeholder="例: Room B"
              />
              <button
                type="button"
                onClick={createTrack}
                disabled={creatingTrack || !newTrackName.trim()}
                className={ui.btnText}
              >
                追加
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTrack(true)}
              className={`mt-1.5 ${ui.btnText}`}
            >
              + 新規会場を追加
            </button>
          )}
        </div>
      </div>

      {!draft.isComingSoon && (
        <div>
          <label className={label}>予約定員(空欄 = 無制限)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={draft.capacityText}
            onChange={(e) => set("capacityText", e.target.value)}
            className={`${input} max-w-[10rem]`}
            placeholder="例: 30"
          />
          <p className="mt-1 text-xs text-zinc-400">
            設定すると参加者はチケットページから満席になるまで予約できます
          </p>
        </div>
      )}

      <div>
        <label className={label}>登壇者(クリックで選択)</label>
        {speakers.length === 0 && !addingSpeaker && (
          <p className="mt-2 text-sm text-zinc-500">まだ登壇者が登録されていません。</p>
        )}
        {speakers.length > 0 && (
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

        {addingSpeaker ? (
          <div className="mt-3 space-y-2 border-2 border-dashed border-zinc-300 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                autoFocus
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                className={input}
                placeholder="氏名 *"
              />
              <input
                value={newSpeakerTitle}
                onChange={(e) => setNewSpeakerTitle(e.target.value)}
                className={input}
                placeholder="肩書き"
              />
              <input
                value={newSpeakerCompany}
                onChange={(e) => setNewSpeakerCompany(e.target.value)}
                className={input}
                placeholder="会社・所属"
              />
            </div>
            <p className="text-xs text-zinc-400">
              写真やSNS等の詳細は
              <Link href={`/dashboard/events/${eventId}/speakers`} className="underline">
                登壇者ページ
              </Link>
              から追加編集できます。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={createSpeaker}
                disabled={creatingSpeaker || !newSpeakerName.trim()}
                className={ui.btn}
              >
                作成して選択
              </button>
              <button
                type="button"
                onClick={() => setAddingSpeaker(false)}
                className={ui.btnGhost}
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSpeaker(true)}
            className={`mt-3 ${ui.btnText}`}
          >
            + 新規登壇者を作成
          </button>
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
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerDoc[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState("");

  useEffect(() => {
    return onSnapshot(doc(db, "events", id), (snap) => {
      setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as EventDoc) : null);
    });
  }, [id]);

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
  const tracks = event?.tracks ?? [];

  async function handleDelete(sessionId: string) {
    if (!confirm("このセッションを削除しますか?")) return;
    await deleteDoc(doc(db, "events", id, "sessions", sessionId));
  }

  async function addTrack() {
    const name = newTrackName.trim();
    if (!name) return;
    await updateDoc(doc(db, "events", id), { tracks: arrayUnion(name) });
    setNewTrackName("");
  }

  async function removeTrack(name: string) {
    await updateDoc(doc(db, "events", id), { tracks: arrayRemove(name) });
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
            登録したセッションは公開LPのタイムテーブルに自動で反映されます。
            <Link href={`/dashboard/events/${id}/banner`} className="underline">
              告知バナーも自動生成
            </Link>
            できます。
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

      <div className={`mt-6 p-5 ${ui.card}`}>
        <p className={ui.h2}>会場管理</p>
        <p className="mt-1.5 text-sm text-zinc-500">
          ここで登録した会場は、セッション編集の「会場」欄から選択できるようになり、
          公開LPのタイムテーブルにも表示されます。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tracks.length === 0 && (
            <p className="text-xs text-zinc-400">まだ会場が登録されていません。</p>
          )}
          {tracks.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-3 pr-1.5 text-xs font-bold"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTrack(t)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-300 hover:text-zinc-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTrack();
              }
            }}
            className={`${input} mt-0 max-w-xs`}
            placeholder="例: Main Stage"
            maxLength={40}
          />
          <button type="button" onClick={addTrack} className={ui.btnGhost}>
            追加
          </button>
        </div>
      </div>

      {adding && (
        <div className="mt-6">
          <SessionForm
            eventId={id}
            initial={emptyDraft}
            speakers={speakers}
            tracks={tracks}
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
                  tracks={tracks}
                  initial={{
                    title: s.title,
                    description: s.description,
                    track: s.track,
                    startsAtLocal: toLocalInput(s.startsAt.toDate()),
                    endsAtLocal: toLocalInput(s.endsAt.toDate()),
                    speakerIds: s.speakerIds ?? [],
                    isComingSoon: s.isComingSoon ?? false,
                    capacityText: s.capacity != null ? String(s.capacity) : "",
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
                    {s.isComingSoon ? (
                      <span className="inline-block rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                        Coming Soon
                      </span>
                    ) : (
                      timeLabel(s)
                    )}
                    {s.track && !s.isComingSoon && (
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
                    {!s.isComingSoon && s.capacity != null && (
                      <p className="mt-1 text-xs text-zinc-500">予約定員 {s.capacity} 名</p>
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
