import { NextRequest } from "next/server";
import { getEventById, getPublicSpeakers } from "@/lib/server/events";
import { renderBannerImage, type BannerSize } from "@/lib/server/bannerImage";

export const runtime = "nodejs";

const VALID_SIZES: BannerSize[] = ["wide", "square", "story"];

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await props.params;
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get("size") ?? "wide";
  const size: BannerSize = VALID_SIZES.includes(sizeParam as BannerSize)
    ? (sizeParam as BannerSize)
    : "wide";

  const event = await getEventById(eventId);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }
  const speakers = await getPublicSpeakers(eventId);

  const image = await renderBannerImage(event, speakers, size);

  if (searchParams.get("download") === "1") {
    image.headers.set(
      "Content-Disposition",
      `attachment; filename="${event.slug}-${size}.png"`
    );
  }
  return image;
}
