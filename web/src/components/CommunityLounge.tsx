"use client";

import { useState } from "react";

export interface LoungeDirectoryEntry {
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  category: string;
  bio: string;
}

export function CommunityLounge({
  registrationId,
  qrToken,
  categories,
  defaultName,
  defaultCompany,
  defaultJobTitle,
  initialEntries,
  initialSelfProfile,
}: {
  registrationId: string;
  qrToken: string;
  categories: string[];
  defaultName: string;
  defaultCompany: string;
  defaultJobTitle: string;
  initialEntries: LoungeDirectoryEntry[];
  initialSelfProfile: LoungeDirectoryEntry | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [self, setSelf] = useState(initialSelfProfile);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(initialSelfProfile?.name ?? defaultName);
  const [company, setCompany] = useState(initialSelfProfile?.company ?? defaultCompany);
  const [jobTitle, setJobTitle] = useState(initialSelfProfile?.jobTitle ?? defaultJobTitle);
  const [category, setCategory] = useState(initialSelfProfile?.category ?? "");
  const [bio, setBio] = useState(initialSelfProfile?.bio ?? "");

  const [contactTarget, setContactTarget] = useState<LoungeDirectoryEntry | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactSent, setContactSent] = useState<string | null>(null);

  const qs = `registrationId=${encodeURIComponent(registrationId)}&k=${encodeURIComponent(qrToken)}`;

  async function refresh() {
    const res = await fetch(`/api/lounge/directory?${qs}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "読み込みに失敗しました");
      return;
    }
    setEntries(data.entries);
    setSelf(data.selfProfile);
    if (data.selfProfile) {
      setName(data.selfProfile.name);
      setCompany(data.selfProfile.company);
      setJobTitle(data.selfProfile.jobTitle);
      setCategory(data.selfProfile.category);
      setBio(data.selfProfile.bio);
    }
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lounge/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, k: qrToken, name, company, jobTitle, category, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!confirm("ラウンジから退出しますか?プロフィールは削除されます。")) return;
    setBusy(true);
    try {
      await fetch("/api/lounge/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, k: qrToken }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactTarget) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lounge/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          k: qrToken,
          toRegistrationId: contactTarget.registrationId,
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setContactSent(contactTarget.registrationId);
      setContactTarget(null);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const others = entries.filter((e) => e.registrationId !== registrationId);

  return (
    <div className="mt-8 border-t border-dashed border-zinc-200 pt-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
        コミュニティラウンジ
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!self || editing ? (
        <form onSubmit={submitJoin} className="mt-3 space-y-3">
          <p className="text-xs text-zinc-500">
            他の参加者に表示するプロフィールです。任意参加・いつでも退出できます。
          </p>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="会社名"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="肩書"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">カテゴリ未選択</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="自己紹介(任意)"
            maxLength={300}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
            >
              {self ? "更新する" : "参加する"}
            </button>
            {self && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border-2 border-zinc-950 px-4 py-2 text-xs font-black"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            <span className="font-bold text-zinc-900">{self.name}</span> として参加中
          </p>
          <div className="flex gap-3 text-xs">
            <button onClick={() => setEditing(true)} className="font-bold underline">
              編集
            </button>
            <button onClick={leave} disabled={busy} className="text-zinc-400 hover:text-red-600">
              退出する
            </button>
          </div>
        </div>
      )}

      {self && (
        <ul className="mt-5 space-y-2">
          {others.length === 0 ? (
            <p className="text-sm text-zinc-400">まだ他の参加者がいません。</p>
          ) : (
            others.map((p) => (
              <li key={p.registrationId} className="rounded-xl border border-zinc-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {[p.company, p.jobTitle].filter(Boolean).join(" / ")}
                    </p>
                    {p.category && (
                      <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        {p.category}
                      </span>
                    )}
                    {p.bio && <p className="mt-1.5 text-xs text-zinc-500">{p.bio}</p>}
                  </div>
                  {contactSent === p.registrationId ? (
                    <span className="shrink-0 text-xs font-bold text-emerald-600">送信済み</span>
                  ) : (
                    <button
                      onClick={() => {
                        setContactTarget(p);
                        setContactSent(null);
                      }}
                      className="shrink-0 rounded-full border-2 border-zinc-950 px-3 py-1.5 text-xs font-black hover:bg-zinc-950 hover:text-white"
                    >
                      メッセージ
                    </button>
                  )}
                </div>

                {contactTarget?.registrationId === p.registrationId && (
                  <form onSubmit={sendContact} className="mt-3 space-y-2 border-t border-dashed border-zinc-200 pt-3">
                    <input
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="件名"
                      maxLength={100}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="メッセージ本文"
                      maxLength={2000}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
                      >
                        送信する
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactTarget(null)}
                        className="rounded-full border-2 border-zinc-950 px-4 py-2 text-xs font-black"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
