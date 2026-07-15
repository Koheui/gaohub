// SVG feTurbulence によるフィルムグレイン(粒子)オーバーレイ。
// 親要素に relative + overflow-hidden を指定して使う。
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function Grain({
  opacity = 0.22,
  blend = "overlay",
}: {
  opacity?: number;
  blend?: "overlay" | "soft-light" | "multiply";
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: NOISE_SVG,
        opacity,
        mixBlendMode: blend,
      }}
    />
  );
}
