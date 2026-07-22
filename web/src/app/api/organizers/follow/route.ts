import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendFollowerWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const {
      organizerId = "default-org",
      lastName,
      firstName,
      handleName,
      email,
      phone,
      address,
      company,
      position,
    } = await req.json();

    if (!email || !lastName || !firstName) {
      return NextResponse.json({ error: "Email, LastName, and FirstName are required" }, { status: 400 });
    }

    const db = adminDb();
    const followerRef = db.collection("organizers").doc(organizerId).collection("followers").doc(email);

    const followerData = {
      email,
      lastName,
      firstName,
      displayName: `${lastName} ${firstName}`,
      handleName: handleName || email.split("@")[0],
      phone: phone || "",
      address: address || "",
      company: company || "",
      position: position || "",
      followedAt: new Date().toISOString(),
    };

    await followerRef.set(followerData, { merge: true });

    // ウェルカムメール通知 (Resend API)
    await sendFollowerWelcomeEmail({
      to: email,
      userName: `${lastName} ${firstName}`,
      organizerName: "Future Studio 株式会社",
    });

    console.log(`[FollowAPI] Registered new follower: ${email} for organizer: ${organizerId}`);

    return NextResponse.json({ success: true, follower: followerData });
  } catch (error) {
    console.error("[FollowAPI Error]:", error);
    return NextResponse.json({ error: "Failed to process follow" }, { status: 500 });
  }
}
