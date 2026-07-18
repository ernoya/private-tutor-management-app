"use client";

import { useState, useEffect, useCallback } from "react";

interface Student {
  id: number;
  name: string;
  phone: string | null;
  parentPhone: string | null;
  grade: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

interface StudentDetails extends Student {
  enrollments: Array<{
    enrollmentId: number;
    groupId: number;
    groupName: string;
    subject: string;
    monthlyFee: string;
    isActive: boolean;
  }>;
  payments: Array<{
    id: number;
    amount: string;
    month: string;
    status: string;
    paidAt: string | null;
  }>;
}

const GRADES = [
  "أولى ابتدائي", "ثانية ابتدائي", "ثالثة ابتدائي",
  "رابعة ابتدائي", "خامسة ابتدائي", "سادسة ابتدائي",
  "أولى إعدادي", "ثانية إعدادي", "ثالثة إعدادي",
  "أولى ثانوي", "ثانية ثانوي", "ثالثة ثانوي",
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", parentPhone: "", grade: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timeout);
  }, [fetchStudents]);

  const openAdd = () => {
    setForm({ name: "", phone: "", parentPhone: "", grade: "", notes: "" });
    setEditMode(false);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setForm({
      name: s.name,
      phone: s.phone || "",
      parentPhone: s.parentPhone || "",
      grade: s.grade || "",
      notes: s.notes || "",
    });
    setEditMode(true);
    setSelectedStudent({ ...s, enrollments: [], payments: [] });
    setShowModal(true);
  };

  const openDetails = async (id: number) => {
    const res = await fetch(`/api/students/${id}`);
    const data = await res.json();
    setSelectedStudent(data);
    setShowDetails(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editMode && selectedStudent) {
        await fetch(`/api/students/${selectedStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      fetchStudents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الطالب؟")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    fetchStudents();
    setShowDetails(false);
  };

  const monthNames: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };

  const getMonthLabel = (m: string) => {
    const [year, month] = m.split("-");
    return `${monthNames[month]} ${year}`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">الطلاب</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <span className="text-lg">+</span> طالب جديد
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="ابحث باسم الطالب أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white rounded-xl py-3 pr-10 pl-4 text-sm border border-slate-200 focus:outline-none focus:border-indigo-400"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-slate-500">
        {students.length} طالب
      </p>

      {/* Students List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl block mb-3">👨‍🎓</span>
          <p className="text-slate-500 font-medium">لا يوجد طلاب بعد</p>
          <p className="text-slate-400 text-sm mt-1">اضغط على "طالب جديد" للبدء</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="card p-4 flex items-center gap-3 active:scale-98"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${(student.id * 47) % 360}, 65%, 55%)` }}
              >
                {student.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0" onClick={() => openDetails(student.id)}>
                <p className="font-bold text-slate-800">{student.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {student.grade && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {student.grade}
                    </span>
                  )}
                  {student.phone && (
                    <span className="text-xs text-slate-500">{student.phone}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(student)}
                  className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8 slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editMode ? "✏️ تعديل بيانات الطالب" : "👨‍🎓 إضافة طالب جديد"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="اسم الطالب كاملاً"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    موبايل الطالب
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    موبايل ولي الأمر
                  </label>
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    placeholder="01..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  الصف الدراسي
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="">اختر الصف</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  ملاحظات
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="أي ملاحظات عن الطالب..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowDetails(false)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-[430px] slide-up overflow-y-auto"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              {/* Student Header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: `hsl(${(selectedStudent.id * 47) % 360}, 65%, 55%)` }}
                >
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h3>
                  {selectedStudent.grade && (
                    <span className="text-sm text-indigo-600">{selectedStudent.grade}</span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                {selectedStudent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📱</span>
                    <span className="text-slate-600">{selectedStudent.phone}</span>
                    <a href={`tel:${selectedStudent.phone}`} className="mr-auto text-indigo-600 font-medium">اتصال</a>
                  </div>
                )}
                {selectedStudent.parentPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>👨‍👧</span>
                    <span className="text-slate-600">ولي الأمر: {selectedStudent.parentPhone}</span>
                    <a href={`tel:${selectedStudent.parentPhone}`} className="mr-auto text-indigo-600 font-medium">اتصال</a>
                  </div>
                )}
                {selectedStudent.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <span>📝</span>
                    <span className="text-slate-600">{selectedStudent.notes}</span>
                  </div>
                )}
              </div>

              {/* Groups */}
              <h4 className="font-bold text-slate-700 mb-2">👥 المجموعات</h4>
              {selectedStudent.enrollments.length === 0 ? (
                <p className="text-slate-400 text-sm mb-4">غير مسجل في أي مجموعة</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {selectedStudent.enrollments.map((e) => (
                    <div key={e.enrollmentId} className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{e.groupName}</p>
                        <p className="text-xs text-slate-500">{e.subject}</p>
                      </div>
                      <span className="font-bold text-indigo-700 text-sm">
                        {parseFloat(e.monthlyFee).toLocaleString("ar-EG")} ج.م/شهر
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Payments */}
              <h4 className="font-bold text-slate-700 mb-2">💳 المدفوعات</h4>
              {selectedStudent.payments.length === 0 ? (
                <p className="text-slate-400 text-sm mb-4">لا توجد مدفوعات</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {selectedStudent.payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{getMonthLabel(p.month)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-800">
                          {parseFloat(p.amount).toLocaleString("ar-EG")} ج.م
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === "مدفوع" ? "bg-green-100 text-green-700" :
                          p.status === "جزئي" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDetails(false); openEdit(selectedStudent); }}
                  className="flex-1 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-medium text-sm"
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(selectedStudent.id)}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-medium text-sm"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
