"use client";

import { useState, useEffect, useCallback } from "react";
import { getSessions, addSession, removeSession, getAttendance, updateAttendance, getGroups } from "@/store";

interface Group { id: number; name: string; subject: string; grade: string | null; }
interface Session { id: number; groupId: number; groupName: string; subject: string; sessionDate: string; startTime: string; endTime: string; notes: string | null; createdAt: string; }
interface AttendanceRecord { id: number; sessionId: number; studentId: number; studentName: string; studentPhone: string | null; status: string; notes: string | null; }

const SUBJECT_COLORS: Record<string, string> = {
  "رياضيات": "#3b82f6", "فيزياء": "#a855f7", "كيمياء": "#22c55e", "أحياء": "#10b981",
  "عربي": "#f97316", "انجليزي": "#0ea5e9", "تاريخ": "#f59e0b", "جغرافيا": "#14b8a6", "أخرى": "#94a3b8",
};
const STATUS_ICONS: Record<string, string> = { "حاضر": "✅", "غائب": "❌", "متأخر": "⏰" };

export default function SchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const [viewDate, setViewDate] = useState(today.toISOString().split("T")[0]);
  const [form, setForm] = useState({ groupId: "", sessionDate: today.toISOString().split("T")[0], startTime: "16:00", endTime: "17:30", notes: "" });

  const fetchSessions = useCallback(() => {
    const year = viewDate.slice(0, 4);
    const month = viewDate.slice(5, 7);
    const from = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const to = `${year}-${month}-${lastDay}`;
    setSessions(getSessions({ from, to }));
  }, [viewDate]);

  const fetchGroups = useCallback(() => { setGroups(getGroups()); }, []);

  useEffect(() => { fetchSessions(); fetchGroups(); }, [fetchSessions, fetchGroups]);

  const handleAddSession = () => {
    if (!form.groupId) return;
    setSaving(true);
    try {
      addSession({ groupId: parseInt(form.groupId), sessionDate: form.sessionDate, startTime: form.startTime, endTime: form.endTime, notes: form.notes || undefined });
      setShowAddSession(false);
      fetchSessions();
    } finally { setSaving(false); }
  };

  const openAttendance = (session: Session) => {
    setSelectedSession(session);
    setAttendanceRecords(getAttendance(session.id));
    setShowAttendance(true);
  };

  const toggleAttendance = (record: AttendanceRecord) => {
    const statuses = ["حاضر", "غائب", "متأخر"];
    const nextStatus = statuses[(statuses.indexOf(record.status) + 1) % 3];
    updateAttendance(record.id, { status: nextStatus });
    setAttendanceRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: nextStatus } : r)));
  };

  const deleteSessionHandler = (id: number) => {
    if (!confirm("هل تريد حذف هذه الحصة؟")) return;
    removeSession(id);
    fetchSessions();
  };

  const sessionsByDate = sessions.reduce((acc, s) => {
    if (!acc[s.sessionDate]) acc[s.sessionDate] = [];
    acc[s.sessionDate].push(s);
    return acc;
  }, {} as Record<string, Session[]>);

  const sortedDates = Object.keys(sessionsByDate).sort().reverse();

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const attendanceCounts = {
    present: attendanceRecords.filter((r) => r.status === "حاضر").length,
    absent: attendanceRecords.filter((r) => r.status === "غائب").length,
    late: attendanceRecords.filter((r) => r.status === "متأخر").length,
  };

  const changeMonth = (delta: number) => {
    const d = new Date(viewDate + "T00:00:00");
    d.setMonth(d.getMonth() + delta);
    setViewDate(d.toISOString().split("T")[0]);
  };

  const monthLabel = new Date(viewDate + "T00:00:00").toLocaleDateString("ar-EG", { year: "numeric", month: "long" });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">الجدول والحضور</h2>
        <button onClick={() => { setForm({ groupId: groups[0]?.id.toString() || "", sessionDate: today.toISOString().split("T")[0], startTime: "16:00", endTime: "17:30", notes: "" }); setShowAddSession(true); }} className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-lg">+</span> حصة
        </button>
      </div>

      <div className="card p-3 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">▶</button>
        <span className="font-bold text-slate-700">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">◀</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center bg-indigo-50">
          <p className="text-2xl font-bold text-indigo-600">{sessions.length}</p>
          <p className="text-xs text-slate-500">حصة</p>
        </div>
        <div className="card p-3 text-center bg-green-50">
          <p className="text-2xl font-bold text-green-600">{new Set(sessions.map((s) => s.groupId)).size}</p>
          <p className="text-xs text-slate-500">مجموعة</p>
        </div>
        <div className="card p-3 text-center bg-purple-50">
          <p className="text-2xl font-bold text-purple-600">{new Set(sessions.map((s) => s.sessionDate)).size}</p>
          <p className="text-xs text-slate-500">يوم</p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl block mb-3">📅</span>
          <p className="text-slate-500 font-medium">لا توجد حصص هذا الشهر</p>
          <p className="text-slate-400 text-sm mt-1">اضغط على "+" لتسجيل حصة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">{formatDate(date)}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-2">
                {sessionsByDate[date].map((session) => (
                  <div key={session.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 rounded-full mt-1 flex-shrink-0" style={{ background: SUBJECT_COLORS[session.subject] || "#94a3b8", height: "40px" }} />
                      <div className="flex-1" onClick={() => openAttendance(session)}>
                        <p className="font-bold text-slate-800">{session.groupName}</p>
                        <p className="text-xs text-slate-500">{session.startTime} – {session.endTime}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block" style={{ background: SUBJECT_COLORS[session.subject] + "20", color: SUBJECT_COLORS[session.subject] }}>
                          {session.subject}
                        </span>
                        {session.notes && <p className="text-xs text-slate-400 mt-1">{session.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => openAttendance(session)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium">الحضور</button>
                        <button onClick={() => deleteSessionHandler(session.id)} className="text-xs bg-red-50 text-red-400 px-2 py-1 rounded-lg">حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddSession(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8 slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-4">📖 تسجيل حصة جديدة</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">المجموعة *</label>
                <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">اختر المجموعة</option>
                  {groups.map((g) => (<option key={g.id} value={g.id}>{g.name} - {g.subject}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">التاريخ</label>
                <input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">من</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">إلى</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">ملاحظات</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي ملاحظة عن الحصة..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddSession(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">إلغاء</button>
              <button onClick={handleAddSession} disabled={saving || !form.groupId} className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttendance && selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAttendance(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-[430px] slide-up overflow-y-auto" style={{ maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">{selectedSession.groupName}</h3>
              <p className="text-sm text-slate-500 mb-4">{formatDate(selectedSession.sessionDate)} | {selectedSession.startTime} – {selectedSession.endTime}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{attendanceCounts.present}</p>
                  <p className="text-xs text-green-600">حاضر</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{attendanceCounts.absent}</p>
                  <p className="text-xs text-red-600">غائب</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-yellow-600">{attendanceCounts.late}</p>
                  <p className="text-xs text-yellow-600">متأخر</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">اضغط على اسم الطالب لتغيير حالة الحضور</p>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-2">📋</span>
                  <p className="text-slate-400 text-sm">لا يوجد طلاب في هذه المجموعة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.map((record) => (
                    <button key={record.id} onClick={() => toggleAttendance(record)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${record.status === "حاضر" ? "border-green-200 bg-green-50" : record.status === "غائب" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `hsl(${(record.studentId * 47) % 360}, 65%, 55%)` }}>
                        {record.studentName.charAt(0)}
                      </div>
                      <span className="flex-1 font-medium text-slate-800 text-sm text-right">{record.studentName}</span>
                      <span className="text-xl">{STATUS_ICONS[record.status]}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${record.status === "حاضر" ? "bg-green-200 text-green-800" : record.status === "غائب" ? "bg-red-200 text-red-800" : "bg-yellow-200 text-yellow-800"}`}>
                        {record.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
