import { NextRequest, NextResponse } from "next/server";
import { verifyPlatformAdmin } from "@/lib/firebase/admin";
import { getOrgDetail } from "@/lib/server/adminAnalytics";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ orgId: string }> }
) {
  const uid = await verifyPlatformAdmin(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const { orgId } = await props.params;
  const detail = await getOrgDetail(orgId);
  if (!detail) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  return NextResponse.json(detail);
}
