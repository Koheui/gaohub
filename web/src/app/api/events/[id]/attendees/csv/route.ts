import { NextRequest, NextResponse } from "next/server";
import { requireEventOrgMember } from "@/lib/server/authz";
import { buildAttendeesCsv } from "@/lib/server/attendeeCsv";

/** 参加者データCSVを返す(ID トークン + org メンバー検証)。レポート/申込者画面から利用。 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireEventOrgMember(req.headers.get("authorization"), id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const csv = await buildAttendeesCsv(id);
  if (csv === null) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  // Excel での文字化けを防ぐため BOM を付与
  const body = "﻿" + csv;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-${id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
