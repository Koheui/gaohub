"use client";

import { useState } from "react";
import type { PublicTicketType } from "@/lib/server/events";
import type { RegistrationFieldDef } from "@/lib/types";
import { formatJpy } from "@/lib/format";

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

export function RegisterForm({
  eventId,
  themeColor,
  tickets,
  initialTicketId,
  registrationFields,
  askCompany,
  requireCompany,
  askJobTitle,
  requireJobTitle,
  companyFieldType,
  companyFieldOptions,
  jobTitleFieldType,
  jobTitleFieldOptions,
  loungeEnabled,
}: {
  eventId: string;
  slug: string;
  themeColor: string;
  tickets: PublicTicketType[];
  initialTicketId: string;
  registrationFields: RegistrationFieldDef[];
  askCompany: boolean;
  requireCompany: boolean;
  askJobTitle: boolean;
  requireJobTitle: boolean;
  companyFieldType: "text" | "select";
  companyFieldOptions: string[];
  jobTitleFieldType: "text" | "select";
  jobTitleFieldOptions: string[];
  loungeEnabled: boolean;
}) {
  const [ticketTypeId, setTicketTypeId] = useState(initialTicketId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [joinLounge, setJoinLounge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = tickets.find((t) => t.id === ticketTypeId)!;

  function setAnswer(id: string, value: string) {
    setCustomAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.requiresVerification && !verificationFile) {
      setError("このチケットには確認書類の画像アップロードが必要です");
      return;
    }
    if (askCompany && requireCompany && !company) {
      setError("会社名を入力してください");
      return;
    }
    if (askJobTitle && requireJobTitle && !jobTitle) {
      setError("役職を入力してください");
      return;
    }
    for (const field of registrationFields) {
      if (field.required && !customAnswers[field.id]) {
        setError(`「${field.label}」を入力してください`);
        return;
      }
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
      formData.set("joinLounge", joinLounge ? "true" : "false");
      for (const field of registrationFields) {
        formData.set(`field_${field.id}`, customAnswers[field.id] ?? "");
      }

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
      {(askCompany || askJobTitle) && (
        <div className="grid grid-cols-2 gap-4">
          {askCompany && (
            <div>
              <label className={label}>
                会社名
                {requireCompany && " *"}
              </label>
              {companyFieldType === "select" ? (
                <select
                  required={requireCompany}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={input}
                >
                  <option value="">選択してください</option>
                  {companyFieldOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={requireCompany}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={input}
                />
              )}
            </div>
          )}
          {askJobTitle && (
            <div>
              <label className={label}>
                役職
                {requireJobTitle && " *"}
              </label>
              {jobTitleFieldType === "select" ? (
                <select
                  required={requireJobTitle}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={input}
                >
                  <option value="">選択してください</option>
                  {jobTitleFieldOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={requireJobTitle}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={input}
                />
              )}
            </div>
          )}
        </div>
      )}

      {registrationFields.map((field) => (
        <div key={field.id}>
          {field.type === "checkbox" ? (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={customAnswers[field.id] === "true"}
                onChange={(e) => setAnswer(field.id, e.target.checked ? "true" : "false")}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-zinc-700">
                {field.label}
                {field.required && " *"}
              </span>
            </label>
          ) : (
            <>
              <label className={label}>
                {field.label}
                {field.required && " *"}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  rows={3}
                  value={customAnswers[field.id] ?? ""}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  className={input}
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={customAnswers[field.id] ?? ""}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  className={input}
                >
                  <option value="">選択してください</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required}
                  value={customAnswers[field.id] ?? ""}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  className={input}
                />
              )}
            </>
          )}
        </div>
      ))}

      {loungeEnabled && (
        <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <input
            type="checkbox"
            checked={joinLounge}
            onChange={(e) => setJoinLounge(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>
            <span className="block text-sm font-bold">コミュニティラウンジに参加する</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              登壇者や参加者同士で交流できるラウンジページに入れます。
              お名前・会社名・役職がプロフィールとして他の参加者に表示されます(あとから編集・退出できます)。
            </span>
          </span>
        </label>
      )}

      {selected.requiresVerification && (
        <div>
          <label className={label}>確認書類の画像 *</label>
          <p className="mt-1 text-xs text-zinc-500">
            学生証・在学証明書など、このチケットの条件を満たすことが分かる画像をアップロードしてください。
            主催者が内容を確認し、<span className="font-bold">確認が済み次第、画像は自動的に破棄されます</span>(保存され続けることはありません)。
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
          アップロードいただいた確認書類は主催者の確認後、自動的に破棄されます
        </p>
      )}
    </form>
  );
}
