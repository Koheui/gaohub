"use client";

import { useState } from "react";

export function ResendForm({ eventId, themeColor }: { eventId: string; themeColor: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <p className="font-bold">送信しました</p>
        <p className="mt-2 text-sm text-zinc-600">
          ご登録が見つかった場合、{email} 宛にチケットページのリンクをお送りしています。
          届かない場合は、申込時のメールアドレスをご確認のうえ再度お試しください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          申込時のメールアドレス *
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          placeholder="you@example.com"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: themeColor }}
      >
        {busy ? "送信中…" : "チケットリンクを送る"}
      </button>
    </form>
  );
}
