import { NextRequest, NextResponse } from "next/server";
import { requireEventOrgMember } from "@/lib/server/authz";
import { sendSurvey } from "@/lib/server/surveys";

/** アンケートを今すぐ送信する(主催者操作)。 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string; surveyId: string }> }
) {
  const { id, surveyId } = await props.params;
  const auth = await requireEventOrgMember(req.headers.get("authorization"), id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await sendSurvey(id, surveyId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
