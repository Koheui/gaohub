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
        // 旧 Safari 5.1 User-Agent により Google Fonts に WOFF2 ではなく TTF 形式を返させる
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-de) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
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
    const arrayBuffer = await fontRes.arrayBuffer();

    // 先頭バイト(Magic Number)チェック: wOF2 (0x77 0x4f 0x46 0x32) の場合は Satori 非対応のため弾く
    const view = new Uint8Array(arrayBuffer);
    if (view[0] === 0x77 && view[1] === 0x4f && view[2] === 0x46 && view[3] === 0x32) {
      console.warn("Received WOFF2 font from Google Fonts, ignoring for Satori compatibility.");
      return null;
    }

    return arrayBuffer;
  } catch {
    return null;
  }
}
