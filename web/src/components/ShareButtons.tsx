"use client";

import { useState } from "react";

/**
 * セッション詳細ページ用のSNSシェアボタン。登壇者が自分の登壇コンテンツを
 * 発信できることが集客の要のため、公開ページに常設する。
 * シェア時のカード画像(OG)はセッションバナーが自動で使われる。
 */
export function ShareButtons({
  url,
  text,
  dark,
}: {
  url: string;
  text: string;
  dark: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const pill = `rounded-full px-5 py-2 text-sm font-black transition-colors ${
    dark
      ? "border border-white/30 hover:bg-white/10"
      : "border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white"
  }`;

  const targets: [string, string][] = [
    ["X でシェア", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`],
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* クリップボード未対応環境では何もしない */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {targets.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={pill}>
          {label} ↗
        </a>
      ))}
      <button onClick={copy} className={pill}>
        {copied ? "コピーしました ✓" : "リンクをコピー"}
      </button>
    </div>
  );
}
