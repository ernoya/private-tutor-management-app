import { NextRequest, NextResponse } from "next/server";
import { getAllSessions, createSession, deleteSession } from "@/db/store";

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get("groupId");
    const dateFrom = req.nextUrl.searchParams.get("from");
    const dateTo = req.nextUrl.searchParams.get("to");

    const result = getAllSessions(
      dateFrom || undefined,
      dateTo || undefined,
      groupId ? parseInt(groupId) : undefined
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب الحصص" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = createSession({
      groupId: body.groupId,
      sessionDate: body.sessionDate,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes || null,
    });
    return NextResponse.json(session);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في إضافة الحصة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    deleteSession(body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في حذف الحصة" }, { status: 500 });
  }
}
