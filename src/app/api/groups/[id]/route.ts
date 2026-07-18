import { NextRequest, NextResponse } from "next/server";
import { getGroup, updateGroup, deleteGroup } from "@/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = getGroup(parseInt(id));
    if (!group)
      return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
    return NextResponse.json(group);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب المجموعة" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateGroup(parseInt(id), {
      name: body.name,
      subject: body.subject,
      grade: body.grade || null,
      monthlyFee: body.monthlyFee?.toString() || "0",
      maxStudents: body.maxStudents || 20,
      notes: body.notes || null,
      isActive: body.isActive ?? true,
      schedules: body.schedules,
    });
    if (!updated)
      return NextResponse.json({ error: "المجموعة غير موجودة" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في تحديث المجموعة" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteGroup(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في حذف المجموعة" }, { status: 500 });
  }
}
