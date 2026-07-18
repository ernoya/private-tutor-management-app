import { NextRequest, NextResponse } from "next/server";
import { getStudent, getStudentDetails, updateStudent, deleteStudent } from "@/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = getStudentDetails(parseInt(id));
    if (!data)
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب الطالب" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateStudent(parseInt(id), {
      name: body.name,
      phone: body.phone || null,
      parentPhone: body.parentPhone || null,
      grade: body.grade || null,
      notes: body.notes || null,
      isActive: body.isActive ?? true,
    });
    if (!updated)
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في تحديث الطالب" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteStudent(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في حذف الطالب" }, { status: 500 });
  }
}
