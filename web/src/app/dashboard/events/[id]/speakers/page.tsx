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
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadEventImage } from "@/lib/upload";
import type { SpeakerDoc } from "@/lib/types";
import { ui } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

const label = ui.label;
const input = ui.input;

interface SpeakerDraft {
  name: string;
  title: string;
  company: string;
  photoUrl: string | null;
  bio: string;
  email: string;
  websiteUrl: string;
  xUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
}

const emptyDraft: SpeakerDraft = {
  name: "",
  title: "",
  company: "",
  photoUrl: null,
  bio: "",
  email: "",
  websiteUrl: "",
  xUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  facebookUrl: "",
};

function SpeakerForm({
  eventId,
  initial,
  speakerId,
  onDone,
  onCancel,
}: {
  eventId: string;
  initial: SpeakerDraft;
  speakerId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SpeakerDraft>(key: K, value: SpeakerDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("photoUrl", await uploadEventImage(eventId, file, "speaker"));
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
      if (speakerId) {
        await updateDoc(doc(db, "events", eventId, "speakers", speakerId), { ...draft });
      } else {
        await addDoc(collection(db, "events", eventId, "speakers"), {
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-2 border-zinc-950 bg-white p-6"
    >
      <div className="flex items-start gap-5">
        <label className="relative block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full bg-zinc-100 hover:ring-2 hover:ring-zinc-400">
          {draft.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              {uploading ? "…" : "写真を選択"}
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
        </label>
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>氏名 *</label>
            <input required value={draft.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>肩書き</label>
            <input value={draft.title} onChange={(e) => set("title", e.target.value)} className={input} placeholder="CEO / デザイナー等" />
          </div>
          <div>
            <label className={label}>会社・所属</label>
            <input value={draft.company} onChange={(e) => set("company", e.target.value)} className={input} />
          </div>
        </div>
      </div>
      <div>
        <label className={label}>プロフィール(詳細ページに表示)</label>
        <textarea
          rows={4}
          value={draft.bio}
          onChange={(e) => set("bio", e.target.value)}
          className={input}
          placeholder="経歴・実績・登壇テーマなど"
        />
      </div>
      <div>
        <label className={label}>メールアドレス(非公開・ラウンジ連絡用)</label>
        <input
          type="email"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
          className={input}
          placeholder="speaker@example.com"
        />
        <p className="mt-1 text-xs text-zinc-400">
          設定すると、コミュニティラウンジの参加者からメッセージを受け取れます。公開ページには表示されません。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Webサイト</label>
          <input type="url" value={draft.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} className={input} placeholder="https://" />
        </div>
        <div>
          <label className={label}>X (Twitter)</label>
          <input type="url" value={draft.xUrl} onChange={(e) => set("xUrl", e.target.value)} className={input} placeholder="https://x.com/..." />
        </div>
        <div>
          <label className={label}>Instagram</label>
          <input type="url" value={draft.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} className={input} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <label className={label}>LinkedIn</label>
          <input type="url" value={draft.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} className={input} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className={label}>Facebook</label>
          <input type="url" value={draft.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} className={input} placeholder="https://facebook.com/..." />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy || uploading}
          className={ui.btn}
        >
          {speakerId ? "保存" : "追加する"}
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

export default function SpeakersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [speakers, setSpeakers] = useState<SpeakerDoc[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events", id, "speakers"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setSpeakers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SpeakerDoc));
    });
  }, [id]);

  async function handleDelete(speakerId: string) {
    if (!confirm("この登壇者を削除しますか?(セッションからも外れます)")) return;
    await deleteDoc(doc(db, "events", id, "speakers", speakerId));
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className={ui.h1}>登壇者</h1>
          <p className="mt-1 text-sm text-zinc-500">
            登録した登壇者はLPに自動反映され、それぞれの詳細ページが生成されます
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className={ui.btn}
          >
            + 登壇者を追加
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-6">
          <SpeakerForm
            eventId={id}
            initial={emptyDraft}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {speakers === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : speakers.length === 0 && !adding ? (
        <div className="mt-8 border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center">
          <p className="text-zinc-500">
            まだ登壇者がいません。登壇者を登録すると、セッション作成時に選択できるようになります。
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {speakers.map((sp) =>
            editingId === sp.id ? (
              <li key={sp.id}>
                <SpeakerForm
                  eventId={id}
                  speakerId={sp.id}
                  initial={{
                    name: sp.name,
                    title: sp.title,
                    company: sp.company,
                    photoUrl: sp.photoUrl,
                    bio: sp.bio ?? "",
                    email: sp.email ?? "",
                    websiteUrl: sp.websiteUrl ?? "",
                    xUrl: sp.xUrl ?? "",
                    instagramUrl: sp.instagramUrl ?? "",
                    linkedinUrl: sp.linkedinUrl ?? "",
                    facebookUrl: sp.facebookUrl ?? "",
                  }}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={sp.id}
                className="flex items-center justify-between border-2 border-zinc-950 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 font-bold text-white">
                      {sp.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{sp.name}</p>
                    <p className="text-sm text-zinc-500">
                      {[sp.company, sp.title].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button
                    onClick={() => setEditingId(sp.id)}
                    className="text-zinc-600 underline hover:text-zinc-900"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(sp.id)}
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
