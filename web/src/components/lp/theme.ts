import type { EventTemplate } from "@/lib/types";

/** 主要ボタン(参加登録など)のスタイル種別 */
export type ButtonStyle = "ink" | "accent" | "paper";
/** 背景キャンバスの生成スタイル */
export type BackdropStyle =
  | "kodak"
  | "spectrum"
  | "aurora"
  | "neon"
  | "swiss"
  | "editorial"
  | "metro";

/** テンプレートごとのデザイントークン(クラス文字列) */
export interface LpTheme {
  id: EventTemplate;
  mode: "light" | "dark";
  /** ページ全体 */
  page: string;
  /** ルートに付与するフォント指定(セリフ系テーマ用)。空文字ならデフォルト(sans) */
  fontClass: string;
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
  /** 浮遊パネルのコンテナ class */
  panel: string;
  /** 背景キャンバスの生成スタイル */
  backdrop: BackdropStyle;
  /** 背景グレインの不透明度(0 なら無し) */
  grain: number;
  /** ヒーローのタイトル/キャッチを白抜きにするか */
  heroLight: boolean;
  /** 主要ボタンのスタイル */
  button: ButtonStyle;
  /** マーキー帯のテキスト色 class */
  marquee: string;
  /** 登壇者セクションのパネルを暗色にするか */
  speakerPanelDark: boolean;
  /** 登壇者写真をモノクロ(mix-blend)にするか */
  speakerGray: boolean;
}

export const LP_THEMES: Record<EventTemplate, LpTheme> = {
  kodak: {
    id: "kodak",
    mode: "light",
    page: "bg-[#f6f5f2] text-zinc-950",
    fontClass: "",
    nav: "border-b-2 border-zinc-950 bg-[#f6f5f2]/90",
    navLink: "text-zinc-600 hover:text-zinc-950",
    border: "border-zinc-950 border-2",
    divide: "divide-zinc-950 border-zinc-950",
    muted: "text-zinc-600",
    radius: "",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#f6f5f2",
    panel: "border-2 border-zinc-950 bg-[#f6f5f2]/90 backdrop-blur-sm",
    backdrop: "kodak",
    grain: 0.32,
    heroLight: false,
    button: "ink",
    marquee: "text-zinc-950/10",
    speakerPanelDark: true,
    speakerGray: true,
  },
  spectrum: {
    id: "spectrum",
    mode: "light",
    page: "bg-[#a1a19c] text-zinc-950",
    fontClass: "",
    nav: "border-b border-black/15 bg-[#a1a19c]/85",
    navLink: "text-zinc-700 hover:text-zinc-950",
    border: "border-black/15 border",
    divide: "divide-zinc-300 border-zinc-300",
    muted: "text-zinc-500",
    radius: "",
    timetableBg: "bg-white",
    ghostLight: true,
    paper: "#a1a19c",
    panel: "bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-sm",
    backdrop: "spectrum",
    grain: 0.38,
    heroLight: true,
    button: "paper",
    marquee: "text-white/30",
    speakerPanelDark: true,
    speakerGray: true,
  },
  aurora: {
    id: "aurora",
    mode: "light",
    page: "bg-[#f7f8fd] text-zinc-900",
    fontClass: "",
    nav: "border-b border-zinc-200 bg-white/70",
    navLink: "text-zinc-500 hover:text-zinc-900",
    border: "border-zinc-200 border",
    divide: "divide-zinc-200 border-zinc-200",
    muted: "text-zinc-500",
    radius: "rounded-3xl",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#f7f8fd",
    panel: "rounded-3xl bg-white/75 shadow-xl shadow-black/5 backdrop-blur-xl",
    backdrop: "aurora",
    grain: 0,
    heroLight: false,
    button: "accent",
    marquee: "text-zinc-950/10",
    speakerPanelDark: false,
    speakerGray: false,
  },

  // ─── 追加テーマ ───

  /** サイバー・ネオンダーク: 漆黒 × シアン/ピンクのネオン発光 × グリッド */
  "neon-cyber": {
    id: "neon-cyber",
    mode: "dark",
    page: "bg-[#09090b] text-zinc-100",
    fontClass: "",
    nav: "border-b border-cyan-400/25 bg-[#09090b]/85",
    navLink: "text-zinc-400 hover:text-cyan-300",
    border: "border-cyan-400/25 border",
    divide: "divide-white/10 border-white/10",
    muted: "text-zinc-400",
    radius: "rounded-xl",
    timetableBg: "bg-white/[0.03]",
    ghostLight: true,
    paper: "#09090b",
    panel:
      "rounded-xl border border-cyan-400/20 bg-white/[0.04] shadow-2xl shadow-cyan-500/10 backdrop-blur-xl",
    backdrop: "neon",
    grain: 0.12,
    heroLight: true,
    button: "accent",
    marquee: "text-cyan-300/15",
    speakerPanelDark: true,
    speakerGray: true,
  },

  /** スイス・タイポグラフィ: 純白/ライトグレー × 超太字 × 単色ビビッドアクセント */
  "swiss-minimal": {
    id: "swiss-minimal",
    mode: "light",
    page: "bg-white text-zinc-950",
    fontClass: "",
    nav: "border-b border-zinc-200 bg-white/90",
    navLink: "text-zinc-500 hover:text-zinc-950",
    border: "border-zinc-200 border",
    divide: "divide-zinc-200 border-zinc-200",
    muted: "text-zinc-500",
    radius: "",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#ffffff",
    panel: "border border-zinc-200 bg-white/95 shadow-sm backdrop-blur-sm",
    backdrop: "swiss",
    grain: 0,
    heroLight: false,
    button: "accent",
    marquee: "text-zinc-950/[0.06]",
    speakerPanelDark: false,
    speakerGray: true,
  },

  /** エディトリアル・ラグジュアリー: ディープグリーン × セリフ体 × 上質感 */
  "editorial-serif": {
    id: "editorial-serif",
    mode: "dark",
    page: "bg-[#0f2419] text-[#f3ede1]",
    fontClass: "font-serif",
    nav: "border-b border-[#f3ede1]/15 bg-[#0f2419]/85",
    navLink: "text-[#c9bfa9] hover:text-[#f3ede1]",
    border: "border-[#f3ede1]/15 border",
    divide: "divide-[#f3ede1]/15 border-[#f3ede1]/15",
    muted: "text-[#c9bfa9]",
    radius: "",
    timetableBg: "bg-[#f3ede1]/[0.04]",
    ghostLight: true,
    paper: "#0f2419",
    panel:
      "border border-[#f3ede1]/15 bg-[#f3ede1]/[0.05] shadow-2xl shadow-black/30 backdrop-blur-md",
    backdrop: "editorial",
    grain: 0.16,
    heroLight: true,
    button: "paper",
    marquee: "text-[#f3ede1]/10",
    speakerPanelDark: true,
    speakerGray: true,
  },

  /** ブルータリズム・グリッド: 太い黒ボーダー × ブロック分割 × ポップな高コントラスト */
  "metro-grid": {
    id: "metro-grid",
    mode: "light",
    page: "bg-[#faf7f0] text-zinc-950",
    fontClass: "",
    nav: "border-b-4 border-zinc-950 bg-[#faf7f0]",
    navLink: "text-zinc-700 hover:text-zinc-950",
    border: "border-zinc-950 border-4",
    divide: "divide-zinc-950 border-zinc-950",
    muted: "text-zinc-600",
    radius: "",
    timetableBg: "bg-white",
    ghostLight: false,
    paper: "#faf7f0",
    panel: "border-4 border-zinc-950 bg-[#faf7f0] shadow-[8px_8px_0_0_#09090b]",
    backdrop: "metro",
    grain: 0,
    heroLight: false,
    button: "ink",
    marquee: "text-zinc-950/[0.08]",
    speakerPanelDark: true,
    speakerGray: false,
  },
};
