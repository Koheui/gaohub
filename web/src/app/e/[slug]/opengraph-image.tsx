import { getPublicSpeakers, getPublishedEventBySlug } from "@/lib/server/events";
import { renderBannerImage } from "@/lib/server/bannerImage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "イベント告知画像";

const FALLBACK_EVENT = {
  id: "",
  slug: "",
  title: "GAO HUB",
  tagline: "",
  description: "",
  coverImageUrl: null,
  themeColor: "#6d28d9",
  template: "kodak" as const,
  ghostText: "",
  showGhostText: true,
  showMarquee: true,
  venueName: "",
  venueAddress: "",
  startsAt: new Date(),
  endsAt: new Date(),
};

export default async function OgImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  const speakers = event ? await getPublicSpeakers(event.id) : [];
  return renderBannerImage(event ?? FALLBACK_EVENT, speakers, "wide");
}
