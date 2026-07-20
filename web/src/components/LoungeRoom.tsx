"use client";

import { useState } from "react";

export interface LoungeEntryView {
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  category: string;
  bio: string;
}

export interface LoungeSpeakerView {
  id: string;
  name: string;
  title: string;
  company: string;
  photoUrl: string | null;
  canContact: boolean;
}

type ContactTarget =
  | { kind: "attendee"; id: string; name: string }
  | { kind: "speaker"; id: string; name: string };

/** カード内に展開するメッセージ送信フォーム(親の再レンダーで消えないようトップレベルで定義) */
function ContactForm({
  targetName,
  subject,
  message,
  busy,
  onSubjectChange,
  onMessageChange,
  onSubmit,
  onCancel,
}: {
  targetName: string;
  subject: string;
  message: string;
  busy: boolean;
  onSubjectChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2 border-t border-dashed border-zinc-200 pt-4">
      <p className="text-xs font-bold text-zinc-500">{targetName} さんへメッセージ</p>
      <input
        required
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        placeholder="件名"
        maxLength={100}
        className={inputCls}
      />
      <textarea
        required
        rows={3}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="メッセージ本文(返信は入力いただいたメールアドレスに届きます)"
        maxLength={2000}
        className={inputCls}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={pillBtn}>
          送信する
        </button>
        <button type="button" onClick={onCancel} className={ghostBtn}>
          キャンセル
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";
const pillBtn =
  "rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-zinc-700 disabled:opacity-40";
const ghostBtn =
  "rounded-full border-2 border-zinc-950 px-4 py-2 text-xs font-black transition-colors hover:bg-zinc-950 hover:text-white disabled:opacity-40";

/**
 * 専用のコミュニティラウンジページ本体。登壇者と参加者の両方を一覧でき、
 * どちらにもUI経由でメッセージを送れる(メールアドレスは互いに非公開)。
 */
export function LoungeRoom({
  registrationId,
  qrToken,
  categories,
  initialEntries,
  initialSpeakers,
  initialSelfProfile,
  defaultName,
  defaultCompany,
  defaultJobTitle,
}: {
  registrationId: string;
  qrToken: string;
  categories: string[];
  initialEntries: LoungeEntryView[];
  initialSpeakers: LoungeSpeakerView[];
  initialSelfProfile: LoungeEntryView | null;
  defaultName: string;
  defaultCompany: string;
  defaultJobTitle: string;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [speakers] = useState(initialSpeakers);
  const [self, setSelf] = useState(initialSelfProfile);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const [name, setName] = useState(initialSelfProfile?.name ?? defaultName);
  const [company, setCompany] = useState(initialSelfProfile?.company ?? defaultCompany);
  const [jobTitle, setJobTitle] = useState(initialSelfProfile?.jobTitle ?? defaultJobTitle);
  const [category, setCategory] = useState(initialSelfProfile?.category ?? "");
  const [bio, setBio] = useState(initialSelfProfile?.bio ?? "");

  const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

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
          ...(contactTarget.kind === "attendee"
            ? { toRegistrationId: contactTarget.id }
            : { toSpeakerId: contactTarget.id }),
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setSentTo(`${contactTarget.kind}:${contactTarget.id}`);
      setContactTarget(null);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const contactFormProps = contactTarget
    ? {
        targetName: contactTarget.name,
        subject,
        message,
        busy,
        onSubjectChange: setSubject,
        onMessageChange: setMessage,
        onSubmit: sendContact,
        onCancel: () => setContactTarget(null),
      }
    : null;

  /* ---- 未参加: 参加フォーム ---- */
  if (!self || editing) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border-2 border-zinc-950 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-tight">
            {self ? "プロフィールを編集" : "ラウンジに参加する"}
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            他の参加者に表示するプロフィールです。任意参加・いつでも退出できます。
          </p>
          <form onSubmit={submitJoin} className="mt-5 space-y-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名"
              className={inputCls}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="会社名"
                className={inputCls}
              />
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="肩書"
                className={inputCls}
              />
            </div>
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
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
              className={inputCls}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className={pillBtn}>
                {self ? "更新する" : "参加する"}
              </button>
              {self && (
                <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ---- 参加済み: ラウンジ本体 ---- */
  const others = entries.filter((e) => e.registrationId !== registrationId);
  const filtered = filter ? others.filter((e) => e.category === filter) : others;

  return (
    <div>
      {/* 自分のステータス */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-zinc-950 bg-white px-5 py-4">
        <p className="text-sm">
          <span className="font-black">{self.name}</span>
          <span className="text-zinc-500"> として参加中</span>
          {self.category && (
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
              {self.category}
            </span>
          )}
        </p>
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="font-bold underline">
            プロフィールを編集
          </button>
          <button onClick={leave} disabled={busy} className="text-zinc-400 hover:text-red-600">
            退出する
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* 登壇者 */}
      {speakers.length > 0 && (
        <section className="mt-10">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Speakers</p>
          <h2 className="mt-1 text-2xl font-black tracking-tighter">登壇者</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {speakers.map((sp) => {
              const key = `speaker:${sp.id}`;
              const isTarget = contactTarget?.kind === "speaker" && contactTarget.id === sp.id;
              return (
                <div key={sp.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {sp.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.photoUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-bold text-white">
                          {sp.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{sp.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {[sp.company, sp.title].filter(Boolean).join(" / ")}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          Speaker
                        </span>
                      </div>
                    </div>
                    {sentTo === key ? (
                      <span className="shrink-0 text-xs font-bold text-emerald-600">送信済み</span>
                    ) : sp.canContact ? (
                      <button
                        onClick={() => {
                          setContactTarget({ kind: "speaker", id: sp.id, name: sp.name });
                          setSentTo(null);
                        }}
                        className={`shrink-0 ${ghostBtn}`}
                      >
                        メッセージ
                      </button>
                    ) : null}
                  </div>
                  {isTarget && contactFormProps && <ContactForm {...contactFormProps} />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 参加者 */}
      <section className="mt-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Attendees</p>
        <h2 className="mt-1 text-2xl font-black tracking-tighter">
          参加者
          <span className="ml-2 text-base font-bold text-zinc-400">{others.length}名</span>
        </h2>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filter === "" ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white hover:border-zinc-500"
              }`}
            >
              すべて
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  filter === c ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white hover:border-zinc-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">
            {filter ? "このカテゴリの参加者はまだいません。" : "まだ他の参加者がいません。"}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {filtered.map((p) => {
              const key = `attendee:${p.registrationId}`;
              const isTarget = contactTarget?.kind === "attendee" && contactTarget.id === p.registrationId;
              return (
                <div key={p.registrationId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{p.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {[p.company, p.jobTitle].filter(Boolean).join(" / ")}
                      </p>
                      {p.category && (
                        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                          {p.category}
                        </span>
                      )}
                      {p.bio && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{p.bio}</p>}
                    </div>
                    {sentTo === key ? (
                      <span className="shrink-0 text-xs font-bold text-emerald-600">送信済み</span>
                    ) : (
                      <button
                        onClick={() => {
                          setContactTarget({ kind: "attendee", id: p.registrationId, name: p.name });
                          setSentTo(null);
                        }}
                        className={`shrink-0 ${ghostBtn}`}
                      >
                        メッセージ
                      </button>
                    )}
                  </div>
                  {isTarget && contactFormProps && <ContactForm {...contactFormProps} />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
