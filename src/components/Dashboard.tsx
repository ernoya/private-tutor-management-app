"use client";

import { useState, useEffect } from "react";
import { getDashboard } from "@/store";

interface DashboardData {
  totalStudents: number;
  totalGroups: number;
  totalSessions: number;
  monthRevenue: number;
  unpaidCount: number;
  currentMonth: string;
  recentPayments: Array<{
    id: number;
    studentName: string;
    amount: string;
    status: string;
    month: string;
    paidAt: string | null;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setData(getDashboard());
  }, []);

  const monthNames: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };

  const getMonthLabel = (m: string) => {
    const [year, month] = m.split("-");
    return `${monthNames[month]} ${year}`;
  };

  if (!data) return null;

  const stats = [
    { label: "إجمالي الطلاب", value: data.totalStudents, icon: "👨‍🎓", color: "from-blue-500 to-blue-600", bg: "bg-blue-50", textColor: "text-blue-600" },
    { label: "المجموعات", value: data.totalGroups, icon: "👥", color: "from-purple-500 to-purple-600", bg: "bg-purple-50", textColor: "text-purple-600" },
    { label: "حصص الشهر", value: data.totalSessions, icon: "📖", color: "from-green-500 to-green-600", bg: "bg-green-50", textColor: "text-green-600" },
    { label: "غير مدفوع", value: data.unpaidCount, icon: "⚠️", color: "from-red-500 to-red-600", bg: "bg-red-50", textColor: "text-red-600" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }} className="rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">أهلاً بك! 👋</h2>
        <p className="text-indigo-200 text-sm mb-3">{getMonthLabel(data.currentMonth)}</p>
        <div className="flex items-center justify-between bg-white/20 rounded-xl p-3">
          <div>
            <p className="text-indigo-100 text-xs">إيرادات الشهر</p>
            <p className="text-white text-2xl font-bold">{data.monthRevenue.toLocaleString("ar-EG")} ج.م</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-4 ${stat.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="text-slate-600 text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span>💳</span> آخر المدفوعات
        </h3>
        {data.recentPayments.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm">لا توجد مدفوعات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{p.studentName}</p>
                  <p className="text-slate-500 text-xs">{getMonthLabel(p.month)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">{parseFloat(p.amount).toLocaleString("ar-EG")} ج.م</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === "مدفوع" ? "bg-green-100 text-green-700" : p.status === "جزئي" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4 bg-amber-50 border border-amber-100">
        <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
          <span>💡</span> تلميحات سريعة
        </h3>
        <ul className="space-y-1 text-amber-700 text-sm">
          <li>• أضف الطلاب أولاً ثم ألحقهم بمجموعاتهم</li>
          <li>• سجّل الحصص لتتبع الحضور تلقائياً</li>
          <li>• راجع المدفوعات شهرياً لمتابعة المتأخرين</li>
        </ul>
      </div>
    </div>
  );
}
