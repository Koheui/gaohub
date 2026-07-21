"use client";

import { useState } from "react";

export function OrganizerFollowCard({
  organizerName,
  eventId,
}: {
  organizerName: string;
  eventId?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/organizers/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organizerName, eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="my-10 rounded-3xl border-2 border-zinc-900 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-white shadow-2xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-black tracking-widest text-amber-300 uppercase">
            <span>🔔 Community Follow</span>
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            主催者「{organizerName}」をフォロー
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-300 leading-relaxed">
            フォローすると、次回開催される新規イベントや先行チケット募集の情報があなたのメール宛に優先配信されます。
          </p>
        </div>

        <div className="w-full shrink-0 md:w-80">
          {done ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm font-bold text-emerald-300">✨ フォロー完了しました！</p>
              <p className="mt-1 text-xs text-zinc-400">
                新着イベント公開時に最新情報をお届けします。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-black text-zinc-950 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "登録中…" : "主催者をフォローする 🔔"}
              </button>
              {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
