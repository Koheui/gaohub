import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const db = adminDb();
  const snap = await db
    .collection(`events/${eventId}/messages`)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const messages = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      respondedAt: data.respondedAt?.toDate?.()?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ messages });
}
