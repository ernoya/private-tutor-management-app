import { NextRequest, NextResponse } from "next/server";
import { getAllPayments, createPayment, updatePayment, deletePayment } from "@/db/store";

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get("month") || undefined;
    const studentId = req.nextUrl.searchParams.get("studentId");
    const groupId = req.nextUrl.searchParams.get("groupId");

    const result = getAllPayments({
      month,
      studentId: studentId ? parseInt(studentId) : undefined,
      groupId: groupId ? parseInt(groupId) : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب المدفوعات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payment = createPayment({
      studentId: body.studentId,
      groupId: body.groupId,
      amount: body.amount.toString(),
      month: body.month,
      status: body.status || "مدفوع",
      notes: body.notes || null,
    });
    return NextResponse.json(payment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في إضافة الدفعة" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updatePayment(body.id, {
      amount: body.amount?.toString(),
      status: body.status,
      notes: body.notes,
    });
    if (!updated)
      return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في تحديث الدفعة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    deletePayment(body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في حذف الدفعة" }, { status: 500 });
  }
}
