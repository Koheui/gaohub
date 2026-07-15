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

const label = "block text-sm font-medium text-zinc-700";
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm";

export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tickets, setTickets] = useState<TicketType[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState("100");
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
        createdAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
      setPrice("0");
      setCapacity("100");
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
      <Link href={`/dashboard/events/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← イベント概要
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">チケット</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          {showForm ? "閉じる" : "+ チケット種別を追加"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 max-w-xl space-y-4 rounded-2xl border border-zinc-200 p-6">
          <div>
            <label className={label}>チケット名 *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="例: 一般 / 早割 / VIP" />
          </div>
          <div>
            <label className={label}>説明</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>価格(円・0で無料) *</label>
              <input required type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>販売枠 *</label>
              <input required type="number" min={1} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={input} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
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
        <ul className="mt-6 divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">
                  {t.name}
                  {!t.isActive && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      停止中
                    </span>
                  )}
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
