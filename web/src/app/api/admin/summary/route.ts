import { NextRequest, NextResponse } from "next/server";
import { verifyPlatformAdmin } from "@/lib/firebase/admin";
import { getAdminOverview } from "@/lib/server/adminAnalytics";

export async function GET(req: NextRequest) {
  const uid = await verifyPlatformAdmin(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "権限がありません" }, { status: 403 });

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
