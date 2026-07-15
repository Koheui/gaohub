"use client";

import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  over: boolean;
}

function remaining(target: number): Remaining {
  const d = Math.max(0, target - Date.now());
  return {
    days: Math.floor(d / 86_400_000),
    hours: Math.floor(d / 3_600_000) % 24,
    minutes: Math.floor(d / 60_000) % 60,
    seconds: Math.floor(d / 1_000) % 60,
    over: d <= 0,
  };
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-black tabular-nums tracking-tighter sm:text-6xl lg:text-7xl">
        {value}
      </span>
      <span className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] opacity-50 sm:text-[11px] sm:tracking-[0.3em]">
        [{label}]
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span className="hidden pb-8 text-4xl font-black opacity-30 sm:block sm:text-5xl">:</span>
  );
}

export function Countdown({ targetIso }: { targetIso: string }) {
  // ハイドレーション不一致を避けるためマウント後に計算
  const [t, setT] = useState<Remaining | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => setT(remaining(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (t?.over) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <Cell value={t ? String(t.days) : "--"} label="Days" />
      <Sep />
      <Cell value={t ? pad(t.hours) : "--"} label="Hours" />
      <Sep />
      <Cell value={t ? pad(t.minutes) : "--"} label="Minutes" />
      <Sep />
      <Cell value={t ? pad(t.seconds) : "--"} label="Seconds" />
    </div>
  );
}
