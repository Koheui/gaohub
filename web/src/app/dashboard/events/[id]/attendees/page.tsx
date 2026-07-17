"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Registration } from "@/lib/types";
import { formatJpy } from "@/lib/format";
import { ui, chip } from "@/lib/ui";

const statusLabel: Record<Registration["status"], string> = {
  confirmed: "確定",
  pending_payment: "決済待ち",
  cancelled: "キャンセル",
};

const verificationLabel: Record<NonNullable<Registration["verificationStatus"]>, string> = {
  pending: "未確認",
  approved: "承認済み",
  rejected: "却下",
};

function toCsv(regs: Registration[]): string {
  const header = [
    "氏名",
    "メールアドレス",
    "会社名",
    "役職",
    "チケット",
    "金額",
    "ステータス",
    "確認書類",
    "チェックイン",
    "申込日時",
  ];
  const rows = regs.map((r) => [
    r.attendee.name,
    r.attendee.email,
    r.attendee.company,
    r.attendee.jobTitle,
    r.ticketTypeName,
    String(r.amountJpy),
    statusLabel[r.status],
    r.verificationStatus ? verificationLabel[r.verificationStatus] : "",
    r.checkedInAt ? r.checkedInAt.toDate().toISOString() : "",
    r.createdAt ? r.createdAt.toDate().toISOString() : "",
  ]);
  return [header, ...rows]
    .map((row) => row.map((c) => `"${(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

function VerificationCell({
  id,
  status,
  hasImage,
}: {
  id: string;
  status: Registration["verificationStatus"];
  hasImage: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  async function viewDocument() {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/registrations/${id}/verification-image`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "取得に失敗しました");
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err instanceof Error ? err.message : "確認書類の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function review(decision: "approved" | "rejected") {
    if (
      !confirm(
        decision === "approved"
          ? "承認しますか?(確認書類はプライバシー保護のため直ちに破棄されます)"
          : "却下しますか?(確認書類はプライバシー保護のため直ちに破棄されます)"
      )
    ) {
      return;
    }
    setReviewing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/registrations/${id}/verification-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "審査に失敗しました");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "審査に失敗しました");
    } finally {
      setReviewing(false);
    }
  }

  if (!status) return <span className="text-zinc-300">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={chip(status === "approved" ? "ok" : status === "rejected" ? "warn" : "mute")}
      >
        [{verificationLabel[status]}]
      </span>
      {hasImage ? (
        <button onClick={viewDocument} disabled={loading} className={ui.btnText}>
          {loading ? "…" : "書類を見る"}
        </button>
      ) : (
        status !== "pending" && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
            書類は破棄済み
          </span>
        )
      )}
      {status === "pending" && (
        <>
          <button
            onClick={() => review("approved")}
            disabled={reviewing}
            className="text-xs font-bold text-emerald-700 underline underline-offset-4 hover:opacity-60 disabled:opacity-40"
          >
            承認
          </button>
          <button
            onClick={() => review("rejected")}
            disabled={reviewing}
            className="text-xs font-bold text-red-700 underline underline-offset-4 hover:opacity-60 disabled:opacity-40"
          >
            却下
          </button>
        </>
      )}
    </div>
  );
}

export default function AttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const orgId = profile?.orgId ?? null;
  const [regs, setRegs] = useState<Registration[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    // orgId 条件はセキュリティルールを list クエリで満たすために必須
    const q = query(
      collection(db, "registrations"),
      where("orgId", "==", orgId),
      where("eventId", "==", id),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setRegs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Registration));
    });
  }, [id, orgId]);

  function downloadCsv() {
    if (!regs) return;
    // ExcelでのUTF-8認識のためBOM付き
    const blob = new Blob(["﻿" + toCsv(regs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendees-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pendingCount = regs?.filter((r) => r.verificationStatus === "pending").length ?? 0;

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className={ui.h1}>
            申込者
            {regs && <span className="ml-2 text-base font-normal text-zinc-500">{regs.length}件</span>}
            {pendingCount > 0 && <span className={`ml-2 ${chip("warn")}`}>[要確認 {pendingCount}件]</span>}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            確認書類はプライバシー保護のため、承認/却下の確定と同時に自動で破棄されます(現地での目視確認に切り替える場合は、審査せず当日に本人確認してください)
          </p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={!regs?.length}
          className={ui.btnGhost}
        >
          CSVダウンロード
        </button>
      </div>

      {regs === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : regs.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">まだ申込がありません。</p>
      ) : (
        <div className="mt-6 overflow-x-auto border-2 border-zinc-950 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">氏名</th>
                <th className="px-4 py-3 font-medium">会社</th>
                <th className="px-4 py-3 font-medium">チケット</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">ステータス</th>
                <th className="px-4 py-3 font-medium">確認書類</th>
                <th className="px-4 py-3 font-medium">チェックイン</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {regs.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.attendee.name}</p>
                    <p className="text-xs text-zinc-500">{r.attendee.email}</p>
                  </td>
                  <td className="px-4 py-3">{r.attendee.company}</td>
                  <td className="px-4 py-3">{r.ticketTypeName}</td>
                  <td className="px-4 py-3 tabular-nums">{formatJpy(r.amountJpy)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "pending_payment"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <VerificationCell
                      id={r.id}
                      status={r.verificationStatus}
                      hasImage={!!r.verificationImagePath}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.checkedInAt
                      ? r.checkedInAt.toDate().toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
