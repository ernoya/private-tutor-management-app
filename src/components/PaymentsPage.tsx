"use client";

import { useState, useEffect, useCallback } from "react";
import { getPayments, addPayment, updatePayment, removePayment, getGroups, getStudents, getGroupById } from "@/store";

interface Payment { id: number; studentId: number; studentName: string; groupId: number; groupName: string; amount: string; month: string; status: string; paidAt: string | null; notes: string | null; createdAt: string; }
interface Group { id: number; name: string; subject: string; monthlyFee: string; studentCount: number; }
interface Student { id: number; name: string; grade: string | null; }

const MONTHS_AR: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};
function getMonthLabel(m: string) {
  const [year, month] = m.split("-");
  return `${MONTHS_AR[month] || month} ${year}`;
}
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ studentId: "", groupId: "", amount: "", month: getCurrentMonth(), status: "مدفوع", notes: "" });
  const [bulkForm, setBulkForm] = useState({ groupId: "", month: getCurrentMonth() });

  const fetchPayments = useCallback(() => { setPayments(getPayments({ month: selectedMonth })); }, [selectedMonth]);
  const fetchGroups = useCallback(() => { setGroups(getGroups()); }, []);
  const fetchStudents = useCallback(() => { setStudents(getStudents()); }, []);

  useEffect(() => { fetchPayments(); fetchGroups(); fetchStudents(); }, [fetchPayments, fetchGroups, fetchStudents]);

  const handleSave = () => {
    if (!form.studentId || !form.groupId || !form.amount) return;
    setSaving(true);
    try {
      addPayment({ studentId: parseInt(form.studentId), groupId: parseInt(form.groupId), amount: parseFloat(form.amount), month: form.month, status: form.status, notes: form.notes || undefined });
      setShowModal(false);
      fetchPayments();
    } finally { setSaving(false); }
  };

  const updateStatus = (p: Payment, newStatus: string) => {
    updatePayment(p.id, { status: newStatus, amount: p.amount, notes: p.notes });
    fetchPayments();
  };

  const deletePayment = (id: number) => {
    if (!confirm("هل تريد حذف هذه الدفعة؟")) return;
    removePayment(id);
    fetchPayments();
  };

  const handleBulkGenerate = () => {
    if (!bulkForm.groupId) return;
    setSaving(true);
    try {
      const group = groups.find((g) => g.id === parseInt(bulkForm.groupId));
      if (!group) return;
      const groupData = getGroupById(parseInt(bulkForm.groupId));
      if (!groupData) return;
      for (const student of groupData.students || []) {
        const existing = payments.find(
          (p) => p.studentId === student.studentId && p.groupId === parseInt(bulkForm.groupId) && p.month === bulkForm.month
        );
        if (!existing) {
          addPayment({ studentId: student.studentId, groupId: parseInt(bulkForm.groupId), amount: parseFloat(group.monthlyFee), month: bulkForm.month, status: "غير مدفوع" });
        }
      }
      setShowBulkModal(false);
      setSelectedMonth(bulkForm.month);
      fetchPayments();
    } finally { setSaving(false); }
  };

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const filtered = payments.filter((p) => filterStatus === "الكل" || p.status === filterStatus);
  const totalPaid = payments.filter((p) => p.status === "مدفوع").reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalUnpaid = payments.filter((p) => p.status === "غير مدفوع").reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">المدفوعات</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)} className="px-3 py-2 rounded-xl bg-amber-100 text-amber-700 text-sm font-medium">📋 إنشاء جماعي</button>
          <button onClick={() => { setForm({ studentId: "", groupId: "", amount: "", month: selectedMonth, status: "مدفوع", notes: "" }); setShowModal(true); }} className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-sm font-medium shadow-md" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <span>+</span> دفعة
          </button>
        </div>
      </div>

      <div className="card p-3 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">▶</button>
        <span className="font-bold text-slate-700">{getMonthLabel(selectedMonth)}</span>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">◀</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 bg-green-50">
          <p className="text-xs text-green-600 mb-1">💚 إجمالي المحصّل</p>
          <p className="text-xl font-bold text-green-700">{totalPaid.toLocaleString("ar-EG")} ج.م</p>
        </div>
        <div className="card p-4 bg-red-50">
          <p className="text-xs text-red-600 mb-1">❤️ إجمالي المتأخر</p>
          <p className="text-xl font-bold text-red-700">{totalUnpaid.toLocaleString("ar-EG")} ج.م</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        {["الكل", "مدفوع", "غير مدفوع", "جزئي"].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"}`}>
            {status}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl block mb-3">💳</span>
          <p className="text-slate-500 font-medium">لا توجد مدفوعات</p>
          <p className="text-slate-400 text-sm mt-1">استخدم &quot;إنشاء جماعي&quot; لإنشاء مدفوعات لمجموعة كاملة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `hsl(${(p.studentId * 47) % 360}, 65%, 55%)` }}>
                  {p.studentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{p.studentName}</p>
                  <p className="text-xs text-slate-500 truncate">{p.groupName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800 text-sm">{parseFloat(p.amount).toLocaleString("ar-EG")} ج.م</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "مدفوع" ? "bg-green-100 text-green-700" : p.status === "جزئي" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                {p.status !== "مدفوع" && <button onClick={() => updateStatus(p, "مدفوع")} className="flex-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium">✅ تم الدفع</button>}
                {p.status !== "جزئي" && <button onClick={() => updateStatus(p, "جزئي")} className="flex-1 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-medium">🔶 جزئي</button>}
                {p.status !== "غير مدفوع" && <button onClick={() => updateStatus(p, "غير مدفوع")} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">❌ غير مدفوع</button>}
                <button onClick={() => deletePayment(p.id)} className="w-8 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8 slide-up overflow-y-auto" style={{ maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-4">💳 إضافة دفعة</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">الطالب *</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">اختر الطالب</option>
                  {students.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">المجموعة *</label>
                <select value={form.groupId} onChange={(e) => { const g = groups.find((g) => g.id === parseInt(e.target.value)); setForm({ ...form, groupId: e.target.value, amount: g ? parseFloat(g.monthlyFee).toString() : form.amount }); }} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">اختر المجموعة</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name} - {g.subject}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">المبلغ (ج.م) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">الشهر</label>
                  <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">الحالة</label>
                <div className="flex gap-2">
                  {["مدفوع", "غير مدفوع", "جزئي"].map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, status: s })} className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${form.status === s ? s === "مدفوع" ? "border-green-500 bg-green-50 text-green-700" : s === "جزئي" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">ملاحظات</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.studentId || !form.groupId || !form.amount} className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">📋 إنشاء مدفوعات جماعي</h3>
            <p className="text-sm text-slate-500 mb-4">سيتم إنشاء دفعة &quot;غير مدفوع&quot; لجميع طلاب المجموعة المختارة</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">المجموعة *</label>
                <select value={bulkForm.groupId} onChange={(e) => setBulkForm({ ...bulkForm, groupId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">اختر المجموعة</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name} - {parseFloat(g.monthlyFee).toLocaleString("ar-EG")} ج.م/شهر</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">الشهر</label>
                <input type="month" value={bulkForm.month} onChange={(e) => setBulkForm({ ...bulkForm, month: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              {bulkForm.groupId && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                  💡 سيتم إنشاء دفعة بمبلغ <strong>{parseFloat(groups.find((g) => g.id === parseInt(bulkForm.groupId))?.monthlyFee || "0").toLocaleString("ar-EG")} ج.م</strong> لكل طالب في هذه المجموعة
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">إلغاء</button>
              <button onClick={handleBulkGenerate} disabled={saving || !bulkForm.groupId} className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {saving ? "جاري الإنشاء..." : "إنشاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
