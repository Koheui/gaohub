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
  coverImageUrl: string | null;
  themeColor: string;
  venueName: string;
  venueAddress: string;
  startsAt: Date;
  endsAt: Date;
}

export interface PublicSpeaker {
  name: string;
  title: string;
  company: string;
  photoUrl: string | null;
}

export interface PublicSession {
  id: string;
  title: string;
  description: string;
  track: string;
  startsAt: Date;
  endsAt: Date;
  speakers: PublicSpeaker[];
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
    coverImageUrl: d.coverImageUrl ?? null,
    themeColor: d.themeColor ?? "#18181b",
    venueName: d.venueName ?? "",
    venueAddress: d.venueAddress ?? "",
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
  };
}

export async function getPublicSessions(eventId: string): Promise<PublicSession[]> {
  const snap = await adminDb()
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .orderBy("startsAt", "asc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title,
      description: d.description ?? "",
      track: d.track ?? "",
      startsAt: d.startsAt.toDate(),
      endsAt: d.endsAt.toDate(),
      speakers: (d.speakers ?? []).map(
        (s: { name?: string; title?: string; company?: string; photoUrl?: string | null }) => ({
          name: s.name ?? "",
          title: s.title ?? "",
          company: s.company ?? "",
          photoUrl: s.photoUrl ?? null,
        })
      ),
    };
  });
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
