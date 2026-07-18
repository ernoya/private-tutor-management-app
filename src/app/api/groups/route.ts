import { NextRequest, NextResponse } from "next/server";
import { getAllGroups, createGroup } from "@/db/store";

export async function GET() {
  try {
    const result = getAllGroups();
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب المجموعات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const group = createGroup({
      name: body.name,
      subject: body.subject,
      grade: body.grade || null,
      monthlyFee: body.monthlyFee?.toString() || "0",
      maxStudents: body.maxStudents || 20,
      notes: body.notes || null,
      schedules: body.schedules || [],
    });
    return NextResponse.json(group);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في إنشاء المجموعة" }, { status: 500 });
  }
}
