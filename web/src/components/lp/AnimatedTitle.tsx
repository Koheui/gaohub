/**
 * タイトルを語(スペース区切り)または文字単位で分割し、
 * 下から立ち上がるスタッガーアニメーションで表示する。
 * サーバーコンポーネント(CSSアニメーションのみ)。
 */
export function AnimatedTitle({ text, baseDelayMs = 0 }: { text: string; baseDelayMs?: number }) {
  const hasSpaces = text.includes(" ");
  // 日本語などスペースのないタイトルは文字単位で割る(長すぎる場合は6文字ずつ)
  const parts = hasSpaces ? text.split(" ") : [...text];
  const step = hasSpaces ? 90 : 45;

  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className="inline-block overflow-hidden align-top">
          <span
            className="lp-rise"
            style={{ animationDelay: `${baseDelayMs + i * step}ms` }}
          >
            {part}
            {hasSpaces && i < parts.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </>
  );
}
