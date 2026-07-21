import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { sendFollowerWelcomeEmail } from "@/lib/email";
import { getEventById } from "@/lib/server/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, organizerName, eventId } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }

    const name = organizerName || "主催者";

    // 重複登録チェック
    const q = query(
      collection(db, "organizer_followers"),
      where("email", "==", email),
      where("organizerName", "==", name)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      await addDoc(collection(db, "organizer_followers"), {
        email,
        organizerName: name,
        eventId: eventId || null,
        createdAt: new Date().toISOString(),
      });

      // ウェルカムメールの即時送信
      let eventTitle = "コミュニティイベント";
      if (eventId) {
        const ev = await getEventById(eventId);
        if (ev) eventTitle = ev.title;
      }

      await sendFollowerWelcomeEmail({
        to: email,
        organizerName: name,
        eventTitle,
      });
    }

    return NextResponse.json({ success: true, message: `主催者「${name}」をフォローしました！` });
  } catch (err: any) {
    console.error("[organizer follow api] error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
