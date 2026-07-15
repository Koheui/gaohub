import "server-only";

// Google Fonts css2 API から、指定テキストに必要なグリフだけの
// サブセットフォント(TTF)を取得する。日本語フルフォントの同梱を避けるため。
export async function loadNotoSansJpBlack(text: string): Promise<ArrayBuffer | null> {
  try {
    const unique = [...new Set(text)].join("");
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@900&text=${encodeURIComponent(unique)}`;
    const cssRes = await fetch(cssUrl, {
      // 古いUAを名乗ると woff2 ではなく TTF が返る(Satori は woff2 非対応)
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:20.0) Gecko/20100101 Firefox/20.0" },
      cache: "no-store",
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}
