import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorageBucket, verifyIdToken } from "@/lib/firebase/admin";

/**
 * 確認書類(学生証等)の画像本体を返す。個人情報のため毎回サーバー側で org 権限を
 * 確認し、バイナリを直接ストリームする(Signed URL は Storage エミュレータでの
 * 署名生成が環境依存で失敗しやすいため使わない)。
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await props.params;
  const db = adminDb();
  const regSnap = await db.doc(`registrations/${id}`).get();
  if (!regSnap.exists) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const orgId = regSnap.get("orgId") as string;
  const memberSnap = await db.doc(`organizations/${orgId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const path = regSnap.get("verificationImagePath") as string | null;
  if (!path) {
    return NextResponse.json({ error: "確認書類がありません" }, { status: 404 });
  }

  const file = adminStorageBucket().file(path);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "確認書類が見つかりません" }, { status: 404 });
  }
  const [[buffer], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": metadata.contentType ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
