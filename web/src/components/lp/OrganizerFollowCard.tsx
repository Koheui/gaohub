"use client";

import { useState } from "react";

export function OrganizerFollowCard({
  organizerName = "Future Studio 株式会社",
  organizerId = "default-org",
}: {
  organizerName?: string;
  organizerId?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [followed, setFollowed] = useState(false);
  
  // ユーザー登録フォーム入力項目
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [handleName, setHandleName] = useState("");
  const [email, setEmail] = useState("");
  
  // 任意項目 (イベント参加・配送用)
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleFollowSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/organizers/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerId,
          lastName,
          firstName,
          handleName,
          email,
          phone,
          address,
          company,
          position,
        }),
      });

      if (!res.ok) throw new Error("Follow request failed");

      setFollowed(true);
      setModalOpen(false);
      alert(`✅ ${organizerName} をフォローしました！新規投稿やイベント情報がメール通知されます。`);
    } catch (err) {
      alert("フォロー処理に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl border-2 border-zinc-900 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-white shadow-2xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="inline-block rounded-full bg-amber-400 px-3 py-1 font-mono text-[10px] font-black text-zinc-950 uppercase">
              Follow Organizer
            </span>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              {organizerName} をフォローする
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              フォローすると、新しい投稿や限定イベント、最新記事が公開された際にメール通知が届きます。
            </p>
          </div>

          <button
            onClick={() => {
              if (followed) {
                setFollowed(false);
              } else {
                setModalOpen(true);
              }
            }}
            className={`shrink-0 rounded-2xl px-7 py-3.5 text-sm font-black transition-transform hover:scale-[1.02] active:scale-[0.98] ${
              followed
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-amber-400 text-zinc-950 shadow-xl"
            }`}
          >
            {followed ? "✓ フォロー中 🔔" : "フォローする 🔔"}
          </button>
        </div>
      </div>

      {/* 📝 ユーザー登録 ＆ フォローモーダル */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black">{organizerName} をフォロー</h3>
                <p className="mt-0.5 text-xs text-zinc-400">ユーザー情報を入力してフォロー登録を完了します。</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFollowSubmit} className="mt-5 space-y-4">
              {/* 必須項目セクション */}
              <div className="space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">【必須項目】</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">姓 (全角必須)</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 岡"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">名 (全角必須)</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 浩平"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">ハンドルネーム (表示名・必須)</label>
                  <input
                    type="text"
                    required
                    placeholder="例: oka / 岡ちゃん"
                    value={handleName}
                    onChange={(e) => setHandleName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400">メールアドレス (新着通知用・必須)</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 任意項目セクション (イベント参加・配送・名刺用) */}
              <div className="mt-6 space-y-3 border-t border-zinc-800/80 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">【任意項目 (イベント参加・配送用)】</span>
                  <span className="text-[10px] text-zinc-500">あとから変更可能</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">電話番号 (任意)</label>
                    <input
                      type="tel"
                      placeholder="090-XXXX-XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">所属 (会社・組織名・任意)</label>
                    <input
                      type="text"
                      placeholder="例: Future Studio 株式会社"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">役職 (任意)</label>
                    <input
                      type="text"
                      placeholder="例: 代表取締役 / CEO"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-500">住所 (任意)</label>
                    <input
                      type="text"
                      placeholder="例: 福岡県北九州市..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-400 hover:bg-zinc-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-black text-zinc-950 transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "登録中…" : "フォローを完了する 🔔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
