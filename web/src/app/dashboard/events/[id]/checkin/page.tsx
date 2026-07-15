"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type ScanResult = {
  result: "ok" | "already" | "invalid";
  name?: string;
  company?: string;
  ticketTypeName?: string;
  checkedInAt?: string;
  error?: string;
};

const READER_ID = "qr-reader";

export default function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scanning, setScanning] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState({ confirmed: 0, checkedIn: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });

  // リアルタイム受付状況
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("eventId", "==", id),
      where("status", "==", "confirmed")
    );
    return onSnapshot(q, (snap) => {
      setStats({
        confirmed: snap.size,
        checkedIn: snap.docs.filter((d) => d.get("checkedInAt")).length,
      });
    });
  }, [id]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function handleDecoded(qrToken: string) {
    // 同一QRの連続読み取りを3秒間抑止
    const now = Date.now();
    if (busyRef.current) return;
    if (lastTokenRef.current.token === qrToken && now - lastTokenRef.current.at < 3000) return;
    busyRef.current = true;
    lastTokenRef.current = { token: qrToken, at: now };

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ eventId: id, qrToken }),
      });
      const data = await res.json();
      setLast(
        res.ok || data.result
          ? (data as ScanResult)
          : { result: "invalid", error: data.error ?? "エラーが発生しました" }
      );
      if (navigator.vibrate) navigator.vibrate(data.result === "ok" ? 100 : [80, 60, 80]);
    } catch {
      setLast({ result: "invalid", error: "通信エラー。電波状況をご確認ください" });
    } finally {
      busyRef.current = false;
    }
  }

  async function startScan() {
    setLast(null);
    setScanning(true);
    // DOM に READER_ID が描画されてから起動
    await new Promise((r) => setTimeout(r, 50));
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => void handleDecoded(text),
        () => {}
      );
    } catch {
      setScanning(false);
      setLast({ result: "invalid", error: "カメラを起動できませんでした。権限をご確認ください" });
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  }

  return (
    <div className="mx-auto max-w-md">
      <Link href={`/dashboard/events/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← イベント概要
      </Link>
      <h1 className="mt-2 text-2xl font-bold">受付(QRスキャン)</h1>

      <div className="mt-4 flex gap-4">
        <div className="flex-1 rounded-2xl border border-zinc-200 p-4 text-center">
          <p className="text-xs text-zinc-500">チェックイン</p>
          <p className="text-2xl font-bold tabular-nums">
            {stats.checkedIn}
            <span className="text-base font-normal text-zinc-400"> / {stats.confirmed}</span>
          </p>
        </div>
        <button
          onClick={scanning ? stopScan : startScan}
          className={`flex-1 rounded-2xl text-sm font-medium ${
            scanning
              ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
        >
          {scanning ? "スキャン停止" : "スキャン開始"}
        </button>
      </div>

      {scanning && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
          <div id={READER_ID} />
        </div>
      )}

      {last && (
        <div
          className={`mt-4 rounded-2xl p-5 ${
            last.result === "ok"
              ? "bg-emerald-50 border border-emerald-200"
              : last.result === "already"
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              last.result === "ok"
                ? "text-emerald-700"
                : last.result === "already"
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {last.result === "ok"
              ? "✓ チェックイン完了"
              : last.result === "already"
                ? "⚠ チェックイン済み"
                : `✕ ${last.error ?? "無効なチケット"}`}
          </p>
          {last.name && (
            <>
              <p className="mt-2 text-xl font-bold">{last.name}</p>
              <p className="text-sm text-zinc-600">
                {last.company}
                {last.ticketTypeName && (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs">
                    {last.ticketTypeName}
                  </span>
                )}
              </p>
              {last.result === "already" && last.checkedInAt && (
                <p className="mt-1 text-xs text-amber-700">
                  {new Date(last.checkedInAt).toLocaleTimeString("ja-JP")} に受付済み
                </p>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-400">
        スマートフォンでこのページを開くと、そのまま受付端末として使えます。読み取りには
        ネットワーク接続が必要です。
      </p>
    </div>
  );
}
