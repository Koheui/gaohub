import type { EventTemplate } from "@/lib/types";

/** テンプレートごとのデザイントークン(クラス文字列) */
export interface LpTheme {
  id: EventTemplate;
  mode: "light" | "dark";
  /** ページ全体 */
  page: string;
  /** 固定ナビ */
  nav: string;
  navLink: string;
  /** セクション区切り線 */
  border: string;
  divide: string;
  /** 補足テキスト */
  muted: string;
  /** カードの角丸(kodak/noirは直角、auroraは丸) */
  radius: string;
  /** タイムテーブルセクションの背景 */
  timetableBg: string;
  /** ゴーストタイポを明色ストロークにするか */
  ghostLight: boolean;
  /** 紙色(グラデーションの起点) */
  paper: string;
}

export const LP_THEMES: Record<EventTemplate, LpTheme> = {
  kodak: {
    id: "kodak",
    mode: "light",
    page: "bg-[#f6f5f2] text-zinc-950",
    nav: "border-b-2 border-zinc-950 bg-[#f6f5f2]/90",
    navLink: "text-zinc-600 hover:text-zinc-950",
    border: "border-zinc-950 border-2",
    divide: "divide-zinc-950 border-zinc-950",
    muted: "text-zinc-600",
    radius: "",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#f6f5f2",
  },
  noir: {
    id: "noir",
    mode: "dark",
    page: "bg-zinc-950 text-white",
    nav: "border-b border-white/15 bg-zinc-950/80",
    navLink: "text-zinc-400 hover:text-white",
    border: "border-white/15 border",
    divide: "divide-white/15 border-white/15",
    muted: "text-zinc-400",
    radius: "",
    timetableBg: "bg-white/[0.03]",
    ghostLight: true,
    paper: "#09090b",
  },
  aurora: {
    id: "aurora",
    mode: "light",
    page: "bg-[#f7f8fd] text-zinc-900",
    nav: "border-b border-zinc-200 bg-white/70",
    navLink: "text-zinc-500 hover:text-zinc-900",
    border: "border-zinc-200 border",
    divide: "divide-zinc-200 border-zinc-200",
    muted: "text-zinc-500",
    radius: "rounded-3xl",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#f7f8fd",
  },
};
