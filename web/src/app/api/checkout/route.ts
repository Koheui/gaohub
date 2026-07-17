import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorageBucket } from "@/lib/firebase/admin";
import { applicationFeeAmount, getStripe } from "@/lib/stripe";
import { sendTicketEmail } from "@/lib/email";
import { appUrl, formatDateRange } from "@/lib/format";

const MAX_VERIFICATION_IMAGE_BYTES = 10 * 1024 * 1024;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("不正なリクエストです");
  }

  const eventId = str(form.get("eventId"));
  const ticketTypeId = str(form.get("ticketTypeId"));
  const name = str(form.get("name"));
  const email = str(form.get("email"));
  const company = str(form.get("company"));
  const jobTitle = str(form.get("jobTitle"));
  const verificationImage = form.get("verificationImage");

  if (!eventId || !ticketTypeId || !name || !email) {
    return bad("必須項目が不足しています");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("メールアドレスの形式が不正です");

  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists || eventSnap.get("status") !== "published") {
    return bad("イベントが見つかりません", 404);
  }
  const ticketSnap = await db.doc(`events/${eventId}/ticketTypes/${ticketTypeId}`).get();
  if (!ticketSnap.exists || !ticketSnap.get("isActive")) {
    return bad("チケットが見つかりません", 404);
  }

  const requiresVerification: boolean = ticketSnap.get("requiresVerification") ?? false;
  if (requiresVerification) {
    if (!(verificationImage instanceof File) || verificationImage.size === 0) {
      return bad("このチケットには確認書類の画像アップロードが必要です");
    }
    if (!verificationImage.type.startsWith("image/")) {
      return bad("確認書類は画像ファイルでアップロードしてください");
    }
    if (verificationImage.size > MAX_VERIFICATION_IMAGE_BYTES) {
      return bad("確認書類の画像は10MB以下にしてください");
    }
  }

  const priceJpy: number = ticketSnap.get("priceJpy") ?? 0;
  // Stripe の JPY 最低決済金額(¥50)未満の有料価格は決済できない(¥0 は Stripe を経由しない)
  if (priceJpy > 0 && priceJpy < 50) {
    return bad("このチケットの価格設定に問題があります。主催者にお問い合わせください");
  }
  const orgId: string = eventSnap.get("orgId");
  const qrToken = crypto.randomBytes(16).toString("hex");

  const regRef = db.collection("registrations").doc();
  let verificationImagePath: string | null = null;
  if (requiresVerification && verificationImage instanceof File) {
    const ext = (verificationImage.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
    verificationImagePath = `registrations/${regRef.id}/verification.${ext}`;
    const buffer = Buffer.from(await verificationImage.arrayBuffer());
    await adminStorageBucket()
      .file(verificationImagePath)
      .save(buffer, { contentType: verificationImage.type, resumable: false });
  }

  const registration = {
    eventId,
    orgId,
    ticketTypeId,
    ticketTypeName: ticketSnap.get("name") as string,
    attendee: { name, email, company, jobTitle },
    amountJpy: priceJpy,
    stripeSessionId: null as string | null,
    stripePaymentIntentId: null as string | null,
    paidAt: null,
    qrToken,
    checkedInAt: null,
    checkedInBy: null,
    verificationImagePath,
    verificationStatus: requiresVerification ? ("pending" as const) : null,
    createdAt: FieldValue.serverTimestamp(),
  };

  const eventTitle: string = eventSnap.get("title");
  const dateText = formatDateRange(
    eventSnap.get("startsAt").toDate(),
    eventSnap.get("endsAt").toDate()
  );
  const venueName: string = eventSnap.get("venueName") ?? "";

  // ---- 無料チケット: 即時確定 ----
  if (priceJpy === 0) {
    try {
      await db.runTransaction(async (tx) => {
        const t = await tx.get(ticketSnap.ref);
        if ((t.get("soldCount") ?? 0) >= (t.get("capacity") ?? 0)) {
          throw new Error("SOLD_OUT");
        }
        tx.update(ticketSnap.ref, { soldCount: FieldValue.increment(1) });
        tx.set(regRef, { ...registration, status: "confirmed" });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "SOLD_OUT") {
        return bad("このチケットは売り切れました");
      }
      throw err;
    }

    const ticketUrl = appUrl(`/t/${regRef.id}?k=${qrToken}`);
    await sendTicketEmail({
      to: email,
      attendeeName: name,
      eventTitle,
      eventDateText: dateText,
      venueName,
      ticketUrl,
    }).catch((e) => console.error("[checkout] ticket email failed:", e));

    return NextResponse.json({ url: ticketUrl });
  }

  // ---- 有料チケット: Stripe Checkout ----
  if ((ticketSnap.get("soldCount") ?? 0) >= (ticketSnap.get("capacity") ?? 0)) {
    return bad("このチケットは売り切れました");
  }

  const orgSnap = await db.doc(`organizations/${orgId}`).get();
  const stripeAccountId = orgSnap.get("stripeAccountId") as string | null;
  const stripeOnboarded = orgSnap.get("stripeOnboarded") as boolean;
  if (!stripeAccountId || !stripeOnboarded) {
    return bad("主催者の決済設定が完了していないため、有料チケットを購入できません");
  }

  await regRef.set({ ...registration, status: "pending_payment" });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: priceJpy,
          product_data: {
            name: `${eventTitle} — ${registration.ticketTypeName}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount(priceJpy),
      transfer_data: { destination: stripeAccountId },
    },
    metadata: { registrationId: regRef.id },
    success_url: appUrl(`/t/${regRef.id}?k=${qrToken}`),
    cancel_url: appUrl(`/e/${eventSnap.get("slug")}`),
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  await regRef.update({ stripeSessionId: session.id });

  return NextResponse.json({ url: session.url });
}
