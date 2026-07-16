/**
 * ダッシュボード共通のデザイントークン(クラス文字列)。
 * 公開LPと同じ言語: 紙色ベース、2pxの黒ボーダー、font-black見出し、
 * uppercaseのスペック風ラベル、黒ピルのボタン。
 */
export const ui = {
  /** ページ見出し */
  h1: "text-3xl font-black tracking-tighter sm:text-4xl",
  /** セクション見出し */
  h2: "text-lg font-black tracking-tight",
  /** スペック風ラベル */
  label: "block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500",
  /** 入力欄 */
  input:
    "mt-1.5 w-full border-2 border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-zinc-950 disabled:bg-zinc-100 disabled:text-zinc-400",
  /** 主ボタン(黒ピル) */
  btn: "inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-zinc-700 disabled:opacity-40",
  /** 副ボタン(黒枠ピル) */
  btnGhost:
    "inline-flex items-center justify-center rounded-full border-2 border-zinc-950 px-5 py-2.5 text-sm font-black transition-colors hover:bg-zinc-950 hover:text-white disabled:opacity-40",
  /** テキストリンク風ボタン */
  btnText: "text-sm font-bold underline underline-offset-4 hover:opacity-60",
  /** カード(黒枠) */
  card: "border-2 border-zinc-950 bg-white",
  /** 破線の空状態ボックス */
  empty: "border-2 border-dashed border-zinc-300 bg-white/50 p-12 text-center",
  /** 戻るリンク */
  back: "text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950",
} as const;

/** ステータスチップ(mono・ブラケット表記) */
export function chip(tone: "ok" | "warn" | "mute"): string {
  const tones = {
    ok: "bg-emerald-100 text-emerald-900",
    warn: "bg-amber-100 text-amber-900",
    mute: "bg-zinc-200 text-zinc-600",
  } as const;
  return `inline-block px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${tones[tone]}`;
}
