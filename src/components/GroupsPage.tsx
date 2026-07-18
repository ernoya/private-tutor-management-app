"use client";

import { useState, useEffect, useCallback } from "react";
import { getGroups, getGroupById, addGroup, updateGroup, removeGroup, addEnrollment, removeEnrollment, getStudents } from "@/store";

interface Schedule { dayOfWeek: string; startTime: string; endTime: string; }
interface Group { id: number; name: string; subject: string; grade: string | null; monthlyFee: string; maxStudents: number | null; notes: string | null; isActive: boolean; schedules: Schedule[]; studentCount: number; }
interface GroupDetails extends Group { students: Array<{ enrollmentId: number; studentId: number; studentName: string; studentPhone: string | null; grade: string | null; isActive: boolean; }>; }
interface AllStudent { id: number; name: string; grade: string | null; phone: string | null; }

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "عربي", "انجليزي", "تاريخ", "جغرافيا", "أخرى"];
const SUBJECT_COLORS: Record<string, string> = {
  "رياضيات": "bg-blue-100 text-blue-700", "فيزياء": "bg-purple-100 text-purple-700", "كيمياء": "bg-green-100 text-green-700",
  "أحياء": "bg-emerald-100 text-emerald-700", "عربي": "bg-orange-100 text-orange-700", "انجليزي": "bg-sky-100 text-sky-700",
  "تاريخ": "bg-amber-100 text-amber-700", "جغرافيا": "bg-teal-100 text-teal-700", "أخرى": "bg-slate-100 text-slate-700",
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [allStudents, setAllStudents] = useState<AllStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", subject: "رياضيات", grade: "", monthlyFee: "", maxStudents: "20", notes: "",
    schedules: [{ dayOfWeek: "السبت", startTime: "16:00", endTime: "17:30" }] as Schedule[],
  });

  const fetchGroups = useCallback(() => { setGroups(getGroups()); }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openAdd = () => {
    setForm({ name: "", subject: "رياضيات", grade: "", monthlyFee: "", maxStudents: "20", notes: "", schedules: [{ dayOfWeek: "السبت", startTime: "16:00", endTime: "17:30" }] });
    setEditMode(false);
    setShowModal(true);
  };

  const openEdit = (g: Group) => {
    setForm({ name: g.name, subject: g.subject, grade: g.grade || "", monthlyFee: parseFloat(g.monthlyFee).toString(), maxStudents: (g.maxStudents || 20).toString(), notes: g.notes || "", schedules: g.schedules.length > 0 ? g.schedules : [{ dayOfWeek: "السبت", startTime: "16:00", endTime: "17:30" }] });
    setEditMode(true);
    setSelectedGroup({ ...g, students: [] });
    setShowModal(true);
  };

  const openDetails = (id: number) => {
    const data = getGroupById(id);
    if (data) { setSelectedGroup(data as GroupDetails); setShowDetails(true); }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = { name: form.name, subject: form.subject, grade: form.grade || null, monthlyFee: parseFloat(form.monthlyFee) || 0, maxStudents: parseInt(form.maxStudents) || 20, notes: form.notes || null, schedules: form.schedules };
      if (editMode && selectedGroup) { updateGroup(selectedGroup.id, body); }
      else { addGroup(body); }
      setShowModal(false);
      fetchGroups();
    } finally { setSaving(false); }
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل تريد حذف هذه المجموعة؟ سيتم حذف جميع البيانات المرتبطة بها.")) return;
    removeGroup(id); setShowDetails(false); fetchGroups();
  };

  const addSchedule = () => setForm((f) => ({ ...f, schedules: [...f.schedules, { dayOfWeek: "السبت", startTime: "16:00", endTime: "17:30" }] }));
  const removeSchedule = (i: number) => setForm((f) => ({ ...f, schedules: f.schedules.filter((_, idx) => idx !== i) }));
  const updateSchedule = (i: number, field: keyof Schedule, value: string) => setForm((f) => ({ ...f, schedules: f.schedules.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }));

  const openEnroll = () => { setAllStudents(getStudents()); setShowEnroll(true); };
  const enrollStudent = (studentId: number) => {
    if (!selectedGroup) return;
    addEnrollment(studentId, selectedGroup.id);
    const updated = getGroupById(selectedGroup.id);
    if (updated) setSelectedGroup(updated as GroupDetails);
  };
  const removeStudent = (studentId: number) => {
    if (!selectedGroup || !confirm("إزالة الطالب من المجموعة؟")) return;
    removeEnrollment(studentId, selectedGroup.id);
    const updated = getGroupById(selectedGroup.id);
    if (updated) setSelectedGroup(updated as GroupDetails);
  };

  const enrolledIds = selectedGroup?.students.map((s) => s.studentId) || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">المجموعات</h2>
        <button onClick={openAdd} className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-lg">+</span> مجموعة جديدة
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl block mb-3">👥</span>
          <p className="text-slate-500 font-medium">لا توجد مجموعات بعد</p>
          <p className="text-slate-400 text-sm mt-1">اضغط على "مجموعة جديدة" للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="card p-4 cursor-pointer" onClick={() => openDetails(group.id)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800">{group.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[group.subject] || SUBJECT_COLORS["أخرى"]}`}>{group.subject}</span>
                  {group.grade && <span className="mr-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{group.grade}</span>}
                </div>
                <div className="text-left">
                  <p className="font-bold text-indigo-600 text-sm">{parseFloat(group.monthlyFee).toLocaleString("ar-EG")} ج.م</p>
                  <p className="text-xs text-slate-400">شهرياً</p>
                </div>
              </div>
              {group.schedules.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {group.schedules.map((s, i) => (<span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">{s.dayOfWeek} {s.startTime}–{s.endTime}</span>))}
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <span>👨‍🎓</span><span>{group.studentCount} طالب</span>
                  {group.maxStudents && <span className="text-slate-300">/ {group.maxStudents}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(group); }} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] slide-up overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-8">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-4">{editMode ? "✏️ تعديل المجموعة" : "👥 مجموعة جديدة"}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">اسم المجموعة *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: مجموعة الرياضيات A" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">المادة</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">الصف</label>
                    <input type="text" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="مثال: ثالثة ثانوي" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">الرسوم الشهرية (ج.م)</label>
                    <input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">أقصى عدد طلاب</label>
                    <input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500">مواعيد الحصص</label>
                    <button onClick={addSchedule} className="text-xs text-indigo-600 font-medium">+ إضافة موعد</button>
                  </div>
                  <div className="space-y-2">
                    {form.schedules.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                        <select value={s.dayOfWeek} onChange={(e) => updateSchedule(i, "dayOfWeek", e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                          {DAYS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                        <input type="time" value={s.startTime} onChange={(e) => updateSchedule(i, "startTime", e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none w-20" />
                        <span className="text-slate-400 text-xs">–</span>
                        <input type="time" value={s.endTime} onChange={(e) => updateSchedule(i, "endTime", e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none w-20" />
                        {form.schedules.length > 1 && <button onClick={() => removeSchedule(i)} className="text-red-400 text-sm">✕</button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">ملاحظات</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">إلغاء</button>
                <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetails && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] slide-up overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedGroup.name}</h3>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${SUBJECT_COLORS[selectedGroup.subject] || ""}`}>{selectedGroup.subject}</span>
                </div>
                <span className="font-bold text-indigo-600">{parseFloat(selectedGroup.monthlyFee).toLocaleString("ar-EG")} ج.م</span>
              </div>
              {selectedGroup.schedules.length > 0 && (
                <div className="bg-indigo-50 rounded-2xl p-3 mb-4">
                  <p className="text-xs font-medium text-indigo-600 mb-2">📅 مواعيد الحصص</p>
                  <div className="space-y-1">
                    {selectedGroup.schedules.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="font-medium">{s.dayOfWeek}</span><span className="text-slate-400">|</span><span>{s.startTime} – {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-700">👨‍🎓 الطلاب ({selectedGroup.students.length})</h4>
                <button onClick={openEnroll} className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">+ إضافة طالب</button>
              </div>
              {selectedGroup.students.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">لا يوجد طلاب في هذه المجموعة</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {selectedGroup.students.map((s) => (
                    <div key={s.enrollmentId} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `hsl(${(s.studentId * 47) % 360}, 65%, 55%)` }}>
                        {s.studentName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{s.studentName}</p>
                        {s.grade && <p className="text-xs text-slate-500">{s.grade}</p>}
                      </div>
                      <button onClick={() => removeStudent(s.studentId)} className="text-red-400 text-xs">إزالة</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowDetails(false); openEdit(selectedGroup); }} className="flex-1 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-medium text-sm">✏️ تعديل</button>
                <button onClick={() => handleDelete(selectedGroup.id)} className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-medium text-sm">🗑️ حذف</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEnroll && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowEnroll(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] slide-up overflow-y-auto" style={{ maxHeight: "70vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-4">إضافة طالب للمجموعة</h3>
              <div className="space-y-2">
                {allStudents.map((s) => {
                  const isEnrolled = enrolledIds.includes(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `hsl(${(s.id * 47) % 360}, 65%, 55%)` }}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                        {s.grade && <p className="text-xs text-slate-500">{s.grade}</p>}
                      </div>
                      {isEnrolled ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">مسجل ✓</span>
                      ) : (
                        <button onClick={() => enrollStudent(s.id)} className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">إضافة</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
