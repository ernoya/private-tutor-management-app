import { NextRequest, NextResponse } from "next/server";
import { createEnrollment, deleteEnrollment } from "@/db/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createEnrollment(body.studentId, body.groupId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.enrollment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في التسجيل" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    deleteEnrollment(body.studentId, body.groupId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في إلغاء التسجيل" }, { status: 500 });
  }
}
