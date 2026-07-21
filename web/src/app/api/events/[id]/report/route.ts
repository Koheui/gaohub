import { NextRequest, NextResponse } from "next/server";
import { requireEventOrgMember } from "@/lib/server/authz";
import { getEventReport } from "@/lib/server/eventReport";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireEventOrgMember(req.headers.get("authorization"), id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const report = await getEventReport(id);
  if (!report) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  return NextResponse.json(report);
}
