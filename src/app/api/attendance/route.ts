import { NextRequest, NextResponse } from "next/server";
import { getAttendance, updateAttendance } from "@/db/store";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId)
      return NextResponse.json({ error: "sessionId مطلوب" }, { status: 400 });

    const records = getAttendance(parseInt(sessionId));
    return NextResponse.json(records);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب الحضور" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateAttendance(body.id, {
      status: body.status,
      notes: body.notes || null,
    });
    if (!updated)
      return NextResponse.json({ error: "سجل غير موجود" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في تحديث الحضور" }, { status: 500 });
  }
}
