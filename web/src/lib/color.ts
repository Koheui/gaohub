/** #rrggbb → HSL */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { h: 14, s: 100, l: 52 }; // 不正値はブランドの赤橙にフォールバック
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 14, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

/**
 * spectrum テンプレートの4色をテーマカラーから生成する。
 * 色相を等間隔に回して類縁色のグラデーション群を作る
 * (例: 赤 → 赤/橙/黄/緑、青 → 青/紫/マゼンタ/ピンク)。
 * アクセント(テーマカラー)と背景が同じ色族になるのが狙い。
 */
export function spectrumStops(themeColor: string): [string, string, string, string] {
  const { h, s } = hexToHsl(themeColor);
  const sat = Math.round(Math.min(Math.max(s, 75), 100));
  // `hsl(${stop} / 0.7)` のようにアルファを付けて使う("H S% L%" のトリプレットを返す)
  const stop = (dh: number, l: number) => `${(h + dh + 360) % 360} ${sat}% ${l}%`;
  return [stop(0, 52), stop(28, 55), stop(56, 58), stop(96, 50)];
}

/**
 * spectrum テンプレートのアクセントカラー(ボタン・バッジ・ボーダー等)。
 * 背景グラデーションの第一ストップ(spectrumStops[0])と同じ H/S/L から作るので、
 * 「アクセントカラーだけテーマカラーの生値」というズレが起きない。
 */
export function spectrumAccent(themeColor: string): string {
  return `hsl(${spectrumStops(themeColor)[0]})`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/**
 * Satori(next/og の画像生成エンジン)は `hsl()` の対応が不安定なため、
 * バナー/OG画像生成では spectrumStops の各ストップを rgba() 文字列に変換して使う。
 */
export function spectrumStopsRgba(themeColor: string, alpha: number): [string, string, string, string] {
  return spectrumStops(themeColor).map((triplet) => {
    const [h, s, l] = triplet.split(" ").map((v) => parseFloat(v));
    const [r, g, b] = hslToRgb(h, s, l);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }) as [string, string, string, string];
}
