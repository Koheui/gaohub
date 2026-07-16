"use client";

import { useRouter } from "next/navigation";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { EventForm, eventToFormValues, type EventFormValues } from "@/components/EventForm";

export default function NewEventPage() {
  const { profile } = useAuth();
  const router = useRouter();

  if (!profile?.orgId) return null;
  const orgId = profile.orgId;

  async function handleSubmit(values: EventFormValues) {
    const slugRef = doc(db, "slugs", values.slug);
    const existing = await getDoc(slugRef);
    if (existing.exists()) throw new Error("このスラッグは既に使われています");

    const eventRef = doc(collection(db, "events"));
    const batch = writeBatch(db);
    batch.set(slugRef, { eventId: eventRef.id, createdAt: serverTimestamp() });
    batch.set(eventRef, {
      orgId,
      slug: values.slug,
      title: values.title,
      tagline: values.tagline,
      description: values.description,
      coverImageUrl: null,
      themeColor: values.themeColor,
      template: values.template,
      venueName: values.venueName,
      venueAddress: values.venueAddress,
      startsAt: Timestamp.fromDate(new Date(values.startsAtLocal)),
      endsAt: Timestamp.fromDate(new Date(values.endsAtLocal)),
      status: "draft",
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    router.push(`/dashboard/events/${eventRef.id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">新規イベント</h1>
      <div className="mt-6">
        <EventForm
          initial={eventToFormValues()}
          submitLabel="下書きとして作成"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
