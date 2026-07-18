import { NextResponse } from "next/server";
import { getDashboard } from "@/db/store";

export async function GET() {
  try {
    const data = getDashboard();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل في جلب الإحصائيات" }, { status: 500 });
  }
}
