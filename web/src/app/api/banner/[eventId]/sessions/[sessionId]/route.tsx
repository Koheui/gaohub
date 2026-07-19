import { NextRequest, NextResponse } from "next/server";
import { getEventById, getPublicSpeakers, getSessionById, pickSpeakers } from "@/lib/server/events";
import {
  renderSessionBannerImage,
  type BannerSize,
  type SessionBannerStyle,
} from "@/lib/server/bannerImage";

export const runtime = "nodejs";

const VALID_SIZES: BannerSize[] = ["wide", "square", "story"];
const VALID_STYLES: SessionBannerStyle[] = ["classic", "duotone", "geo"];

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string; sessionId: string }> }
) {
  const { eventId, sessionId } = await props.params;
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get("size") ?? "wide";
  const size: BannerSize = VALID_SIZES.includes(sizeParam as BannerSize)
    ? (sizeParam as BannerSize)
    : "wide";
  const styleParam = searchParams.get("style") ?? "classic";
  const style: SessionBannerStyle = VALID_STYLES.includes(styleParam as SessionBannerStyle)
    ? (styleParam as SessionBannerStyle)
    : "classic";

  const [event, session] = await Promise.all([
    getEventById(eventId),
    getSessionById(eventId, sessionId),
  ]);
  if (!event || !session) {
    return new Response("Not found", { status: 404 });
  }
  // Content-Disposition の filename は ISO-8859-1(ByteString) でなければならず、
  // 日本語タイトルをそのまま入れると Headers.set が例外を投げる。
  // ASCII のみの filename(フォールバック)と、RFC 5987 の filename*(日本語対応)を両方送る。
  const asciiTitle =
    session.title.replace(/[^a-zA-Z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
    "session";

  // 手動アップロードされたバナーがあれば、自動生成の代わりにそちらを使う
  if (session.customBannerUrl) {
    if (searchParams.get("download") === "1") {
      const res = await fetch(session.customBannerUrl);
      if (!res.ok) return new Response("Not found", { status: 404 });
      const contentType = res.headers.get("content-type") ?? "image/png";
      const ext = contentType.split("/")[1]?.split("+")[0] ?? "png";
      const buffer = Buffer.from(await res.arrayBuffer());
      const utf8Name = `${event.slug}-${session.title}.${ext}`;
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${event.slug}-${asciiTitle}.${ext}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`,
        },
      });
    }
    return NextResponse.redirect(session.customBannerUrl);
  }

  const allSpeakers = await getPublicSpeakers(eventId);
  const speakers = pickSpeakers(allSpeakers, session.speakerIds);

  const image = await renderSessionBannerImage(event, session, speakers, size, style);

  if (searchParams.get("download") === "1") {
    const utf8Name = `${event.slug}-${session.title}-${size}.png`;
    image.headers.set(
      "Content-Disposition",
      `attachment; filename="${event.slug}-${asciiTitle}-${size}.png"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`
    );
  }
  return image;
}
