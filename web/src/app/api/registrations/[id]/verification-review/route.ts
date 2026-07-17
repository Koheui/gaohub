import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorageBucket, verifyIdToken } from "@/lib/firebase/admin";

/**
 * 確認書類(学生証等)の審査を確定する。承認/却下のどちらでも、
 * 判定後は書類画像を Storage から**即座に破棄**する(個人情報を保持し続けないため)。
 * 破棄が前提なので、審査は取り消せない一回きりの操作。
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  let body: { decision?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
  const decision = body.decision;
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "decision は approved / rejected のいずれかです" }, { status: 400 });
  }

  const db = adminDb();
  const regRef = db.doc(`registrations/${(await props.params).id}`);
  const regSnap = await regRef.get();
  if (!regSnap.exists) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const orgId = regSnap.get("orgId") as string;
  const memberSnap = await db.doc(`organizations/${orgId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  if (regSnap.get("verificationStatus") !== "pending") {
    return NextResponse.json({ error: "この申込は審査済みです" }, { status: 409 });
  }

  // 先にステータスを確定し、その後に書類を破棄する
  const path = regSnap.get("verificationImagePath") as string | null;
  await regRef.update({
    verificationStatus: decision,
    verificationImagePath: null,
  });
  if (path) {
    await adminStorageBucket()
      .file(path)
      .delete()
      .catch((e) => console.error("[verification-review] failed to delete document image:", e));
  }

  return NextResponse.json({ ok: true, verificationStatus: decision });
}
