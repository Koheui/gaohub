import { NextRequest } from "next/server";
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

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await props.params;
    const { searchParams } = new URL(req.url);
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
      return new Response("Not found", { status: 404 });
    }
    const speakers = await getPublicSpeakers(eventId);

    const image =
      style === "timetable"
        ? await renderTimetableBannerImage(event, await getPublicSessions(eventId), speakers, size)
        : await renderBannerImage(event, speakers, size);

    if (searchParams.get("download") === "1") {
      image.headers.set(
        "Content-Disposition",
        `attachment; filename="${event.slug}-${style}-${size}.png"`
      );
    }
    return image;
  } catch (err: any) {
    console.error("Banner API GET Error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || String(err),
        stack: err?.stack,
        name: err?.name,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
