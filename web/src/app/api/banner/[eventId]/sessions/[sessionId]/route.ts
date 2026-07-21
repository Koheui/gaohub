import { NextRequest, NextResponse } from "next/server";
import { getEventById, getPublicSpeakers, getSessionById, pickSpeakers } from "@/lib/server/events";
import {
  renderSessionBannerImage,
  type BannerSize,
  type SessionBannerStyle,
} from "@/lib/server/bannerImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SIZES: BannerSize[] = ["wide", "square", "story"];
const VALID_STYLES: SessionBannerStyle[] = ["classic", "duotone", "geo"];

export async function GET(req: NextRequest, context: any) {
  try {
    const rawParams = context?.params ? await context.params : {};
    let eventId = rawParams?.eventId;
    let sessionId = rawParams?.sessionId;
    if (!eventId || !sessionId) {
      const parts = req.nextUrl.pathname.split("/").filter(Boolean);
      // /api/banner/[eventId]/sessions/[sessionId]
      eventId = eventId || parts[2];
      sessionId = sessionId || parts[4];
    }
    if (!eventId || !sessionId) {
      return NextResponse.json({ error: "Missing eventId or sessionId" }, { status: 400 });
    }

    const { searchParams } = req.nextUrl;
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const asciiTitle =
      session.title.replace(/[^a-zA-Z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
      "session";

    if (session.customBannerUrl) {
      if (searchParams.get("download") === "1") {
        const res = await fetch(session.customBannerUrl);
        if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  } catch (err: any) {
    console.error("Session Banner API Error:", err);
    return NextResponse.json(
      {
        error: err?.message || String(err),
        stack: err?.stack,
        name: err?.name,
      },
      { status: 500 }
    );
  }
}
