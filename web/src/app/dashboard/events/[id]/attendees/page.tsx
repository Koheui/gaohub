"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Registration } from "@/lib/types";
import { formatJpy } from "@/lib/format";

const statusLabel: Record<Registration["status"], string> = {
  confirmed: "確定",
  pending_payment: "決済待ち",
  cancelled: "キャンセル",
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
    r.checkedInAt ? r.checkedInAt.toDate().toISOString() : "",
    r.createdAt ? r.createdAt.toDate().toISOString() : "",
  ]);
  return [header, ...rows]
    .map((row) => row.map((c) => `"${(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
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

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          申込者
          {regs && <span className="ml-2 text-base font-normal text-zinc-500">{regs.length}件</span>}
        </h1>
        <button
          onClick={downloadCsv}
          disabled={!regs?.length}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
        >
          CSVダウンロード
        </button>
      </div>

      {regs === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : regs.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">まだ申込がありません。</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">氏名</th>
                <th className="px-4 py-3 font-medium">会社</th>
                <th className="px-4 py-3 font-medium">チケット</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">ステータス</th>
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
