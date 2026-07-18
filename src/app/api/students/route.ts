import { NextRequest, NextResponse } from "next/server";
import { getAllStudents, createStudent } from "@/db/store";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";
    const all = getAllStudents(search || undefined);
    return NextResponse.json(all);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب الطلاب" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student = createStudent({
      name: body.name,
      phone: body.phone || null,
      parentPhone: body.parentPhone || null,
      grade: body.grade || null,
      notes: body.notes || null,
      isActive: true,
    });
    return NextResponse.json(student);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في إضافة الطالب" }, { status: 500 });
  }
}
