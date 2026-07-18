"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TicketType } from "@/lib/types";
import { formatJpy } from "@/lib/format";
import { ui, chip } from "@/lib/ui";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

const label = ui.label;
const input = ui.input;

export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tickets, setTickets] = useState<TicketType[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("100");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "events", id, "ticketTypes"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TicketType));
    });
  }, [id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Math.floor(Number(price));
    // Stripe の JPY 最低決済金額は ¥50。無料(¥0)は Stripe を経由しないので制限なし
    if (priceNum > 0 && priceNum < 50) {
      setError("1〜49円は設定できません(Stripeの最低決済金額のため)。無料にする場合は0円にしてください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(db, "events", id, "ticketTypes"), {
        name,
        description,
        priceJpy: Math.max(0, Math.floor(Number(price))),
        capacity: Math.max(1, Math.floor(Number(capacity))),
        soldCount: 0,
        isActive: true,
        requiresVerification,
        createdAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
      setPrice("0");
      setCapacity("100");
      setRequiresVerification(false);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(t: TicketType) {
    await updateDoc(doc(db, "events", id, "ticketTypes", t.id), {
      isActive: !t.isActive,
    });
  }

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} className={ui.back}>
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className={ui.h1}>チケット</h1>
        <div className="flex items-center gap-3">
          <ViewPublicPageButton eventId={id} />
          <button
            onClick={() => setShowForm((v) => !v)}
            className={ui.btn}
          >
            {showForm ? "閉じる" : "+ チケット種別を追加"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 max-w-xl space-y-4 border-2 border-zinc-950 bg-white p-6">
          <div>
            <label className={label}>チケット名 *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="例: 一般 / 学生 / VIP" />
          </div>
          <div>
            <label className={label}>説明</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>価格(円・0で無料) *</label>
              <input required type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
              <p className="mt-1 text-xs text-zinc-400">
                0円=無料(Stripe不要・決済なしで即確定)。有料は50円以上
              </p>
            </div>
            <div>
              <label className={label}>販売枠 *</label>
              <input required type="number" min={1} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={input} />
            </div>
          </div>
          <label className="flex items-start gap-3 border-2 border-zinc-200 p-4">
            <input
              type="checkbox"
              checked={requiresVerification}
              onChange={(e) => setRequiresVerification(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              <span className="block text-sm font-bold">確認書類のアップロードを必須にする</span>
              <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                学生証・在学証明書など。申込時に画像アップロードを求め、主催者が申込者一覧で内容を確認・承認/却下できます。
              </span>
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className={ui.btn}
          >
            追加する
          </button>
        </form>
      )}

      {tickets === null ? (
        <p className="mt-8 text-sm text-zinc-400">読み込み中…</p>
      ) : tickets.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          チケット種別がまだありません。有料・無料どちらも作成できます。
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 border-2 border-zinc-950 bg-white">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {t.name}
                  {!t.isActive && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      停止中
                    </span>
                  )}
                  {t.requiresVerification && <span className={chip("warn")}>[要確認書類]</span>}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {formatJpy(t.priceJpy)} ・ {t.soldCount}/{t.capacity} 枚
                </p>
              </div>
              <button
                onClick={() => toggleActive(t)}
                className="text-sm text-zinc-600 underline hover:text-zinc-900"
              >
                {t.isActive ? "販売停止" : "販売再開"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
