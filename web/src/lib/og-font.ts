import "server-only";

// Google Fonts css2 API から、指定テキストに必要なグリフだけの
// サブセットフォント(TTF)を取得する。日本語フルフォントの同梱を避けるため。
export async function loadNotoSansJpBlack(text: string): Promise<ArrayBuffer | null> {
  try {
    const unique = [...new Set(text)].join("");
    if (!unique) return null;
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@900&text=${encodeURIComponent(unique)}`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        // TTF フォントを取得するための旧 Firefox User-Agent
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
      cache: "force-cache",
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) return null;
    const fontUrl = match[1].replace(/["']/g, "");
    const fontRes = await fetch(fontUrl, { cache: "force-cache" });
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}
