"use client";

import { useState } from "react";
import type { PublicTicketType } from "@/lib/server/events";
import { formatJpy } from "@/lib/format";

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

export function RegisterForm({
  eventId,
  themeColor,
  tickets,
  initialTicketId,
}: {
  eventId: string;
  slug: string;
  themeColor: string;
  tickets: PublicTicketType[];
  initialTicketId: string;
}) {
  const [ticketTypeId, setTicketTypeId] = useState(initialTicketId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = tickets.find((t) => t.id === ticketTypeId)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.requiresVerification && !verificationFile) {
      setError("このチケットには確認書類の画像アップロードが必要です");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
      formData.set("ticketTypeId", ticketTypeId);
      formData.set("name", name);
      formData.set("email", email);
      formData.set("company", company);
      formData.set("jobTitle", jobTitle);
      if (verificationFile) formData.set("verificationImage", verificationFile);

      const res = await fetch("/api/checkout", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "申し込みに失敗しました");
      // 有料 → Stripe Checkout へ / 無料 → チケットページへ
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "申し込みに失敗しました");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-5">
      <div>
        <label className={label}>チケット *</label>
        <div className="mt-2 space-y-2">
          {tickets.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${
                t.id === ticketTypeId ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ticket"
                  checked={t.id === ticketTypeId}
                  onChange={() => {
                    setTicketTypeId(t.id);
                    setVerificationFile(null);
                    setError(null);
                  }}
                />
                <span className="text-sm font-medium">
                  {t.name}
                  {t.requiresVerification && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      要確認書類
                    </span>
                  )}
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums">{formatJpy(t.priceJpy)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>お名前 *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </div>
      <div>
        <label className={label}>メールアドレス *</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <p className="mt-1 text-xs text-zinc-400">QRチケットをこのアドレスへお送りします</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>会社名</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>役職</label>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={input} />
        </div>
      </div>

      {selected.requiresVerification && (
        <div>
          <label className={label}>確認書類の画像 *</label>
          <p className="mt-1 text-xs text-zinc-500">
            学生証・在学証明書など、このチケットの条件を満たすことが分かる画像をアップロードしてください。主催者が内容を確認します。
          </p>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
            className="mt-2 w-full text-sm"
          />
          {verificationFile && (
            <p className="mt-1 text-xs text-emerald-700">選択済み: {verificationFile.name}</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: themeColor }}
      >
        {busy
          ? "処理中…"
          : selected.priceJpy === 0
            ? "無料で申し込む"
            : `${formatJpy(selected.priceJpy)} を支払って申し込む`}
      </button>
      {selected.priceJpy > 0 && (
        <p className="text-center text-xs text-zinc-400">
          決済は Stripe の安全なページで行われます
        </p>
      )}
      {selected.requiresVerification && (
        <p className="text-center text-xs text-zinc-400">
          アップロードいただいた確認書類は主催者が内容を確認します
        </p>
      )}
    </form>
  );
}
