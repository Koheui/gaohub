import { NextRequest, NextResponse } from "next/server";
import { getEventById, getPublicSessions, getPublicSpeakers } from "@/lib/server/events";
import {
  renderBannerImage,
  renderTimetableBannerImage,
  type BannerSize,
  type EventBannerStyle,
} from "@/lib/server/bannerImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SIZES: BannerSize[] = ["wide", "square", "story"];
const VALID_STYLES: EventBannerStyle[] = ["classic", "timetable"];

export async function GET(req: NextRequest, context: any) {
  try {
    const rawParams = context?.params ? await context.params : {};
    let eventId = rawParams?.eventId;
    if (!eventId) {
      const parts = req.nextUrl.pathname.split("/").filter(Boolean);
      eventId = parts[2]; // /api/banner/[eventId]
    }
    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const { searchParams } = req.nextUrl;
    const sizeParam = searchParams.get("size") ?? "wide";
    const size: BannerSize = VALID_SIZES.includes(sizeParam as BannerSize)
      ? (sizeParam as BannerSize)
      : "wide";
    const styleParam = searchParams.get("style") ?? "classic";
    const style: EventBannerStyle = VALID_STYLES.includes(styleParam as EventBannerStyle)
      ? (styleParam as EventBannerStyle)
      : "classic";

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: `Event not found for ID: ${eventId}` }, { status: 404 });
    }
    const speakers = await getPublicSpeakers(eventId);

    const image =
      style === "timetable"
        ? await renderTimetableBannerImage(event, await getPublicSessions(eventId), speakers, size)
        : await renderBannerImage(event, speakers, size);

    if (searchParams.get("download") === "1") {
      const asciiSlug =
        (event.slug || "").replace(/[^a-zA-Z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
        "event";
      const utf8Name = `${event.slug || "event"}-${style}-${size}.png`;
      image.headers.set(
        "Content-Disposition",
        `attachment; filename="${asciiSlug}-${style}-${size}.png"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`
      );
    }
    return image;
  } catch (err: any) {
    console.error("Banner API GET Error:", err);
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
