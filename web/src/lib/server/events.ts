import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export interface PublicTicketType {
  id: string;
  name: string;
  description: string;
  priceJpy: number;
  soldOut: boolean;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  themeColor: string;
  venueName: string;
  venueAddress: string;
  startsAt: Date;
  endsAt: Date;
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEvent | null> {
  const snap = await adminDb()
    .collection("events")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const d = doc.data();
  return {
    id: doc.id,
    slug: d.slug,
    title: d.title,
    description: d.description ?? "",
    themeColor: d.themeColor ?? "#18181b",
    venueName: d.venueName ?? "",
    venueAddress: d.venueAddress ?? "",
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
  };
}

export async function getPublicTicketTypes(eventId: string): Promise<PublicTicketType[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("ticketTypes")
    .where("isActive", "==", true)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      description: d.description ?? "",
      priceJpy: d.priceJpy ?? 0,
      soldOut: (d.soldCount ?? 0) >= (d.capacity ?? 0),
    };
  });
}
