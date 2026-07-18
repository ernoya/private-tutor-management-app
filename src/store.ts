const DATA_KEY = "madrasti_data";

export interface Student {
  id: number;
  name: string;
  phone: string | null;
  parentPhone: string | null;
  grade: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  subject: string;
  grade: string | null;
  monthlyFee: string;
  maxStudents: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface GroupSchedule {
  id: number;
  groupId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  groupId: number;
  enrolledAt: string;
  isActive: boolean;
}

export interface Session {
  id: number;
  groupId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  createdAt: string;
}

export interface Attendance {
  id: number;
  sessionId: number;
  studentId: number;
  status: string;
  notes: string | null;
}

export interface Payment {
  id: number;
  studentId: number;
  groupId: number;
  amount: string;
  month: string;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface DataStore {
  students: Student[];
  groups: Group[];
  groupSchedules: GroupSchedule[];
  enrollments: Enrollment[];
  sessions: Session[];
  attendance: Attendance[];
  payments: Payment[];
  counters: {
    students: number;
    groups: number;
    groupSchedules: number;
    enrollments: number;
    sessions: number;
    attendance: number;
    payments: number;
  };
}

const defaultData: DataStore = {
  students: [],
  groups: [],
  groupSchedules: [],
  enrollments: [],
  sessions: [],
  attendance: [],
  payments: [],
  counters: { students: 1, groups: 1, groupSchedules: 1, enrollments: 1, sessions: 1, attendance: 1, payments: 1 },
};

function load(): DataStore {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(defaultData);
}

function save(data: DataStore) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function now() {
  return new Date().toISOString();
}

// ====== Students ======
export function getStudents(search?: string): Student[] {
  const s = load();
  let list = s.students;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (st) => st.name.toLowerCase().includes(q) || (st.phone && st.phone.includes(q))
    );
  }
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStudentById(id: number) {
  const s = load();
  const st = s.students.find((x) => x.id === id);
  if (!st) return null;
  return {
    ...st,
    enrollments: s.enrollments
      .filter((e) => e.studentId === id)
      .map((e) => {
        const g = s.groups.find((gr) => gr.id === e.groupId);
        return {
          enrollmentId: e.id,
          groupId: e.groupId,
          groupName: g?.name || "",
          subject: g?.subject || "",
          monthlyFee: g?.monthlyFee || "0",
          isActive: e.isActive,
        };
      }),
    payments: s.payments
      .filter((p) => p.studentId === id)
      .map((p) => ({ id: p.id, amount: p.amount, month: p.month, status: p.status, paidAt: p.paidAt, groupId: p.groupId, notes: p.notes })),
  };
}

export function addStudent(data: { name: string; phone?: string; parentPhone?: string; grade?: string; notes?: string }): Student {
  const s = load();
  const student: Student = {
    id: s.counters.students++,
    name: data.name,
    phone: data.phone || null,
    parentPhone: data.parentPhone || null,
    grade: data.grade || null,
    notes: data.notes || null,
    isActive: true,
    createdAt: now(),
  };
  s.students.push(student);
  save(s);
  return student;
}

export function updateStudent(id: number, data: Partial<Student>) {
  const s = load();
  const idx = s.students.findIndex((st) => st.id === id);
  if (idx === -1) return null;
  s.students[idx] = { ...s.students[idx], ...data };
  save(s);
  return s.students[idx];
}

export function removeStudent(id: number) {
  const s = load();
  s.students = s.students.filter((st) => st.id !== id);
  s.enrollments = s.enrollments.filter((e) => e.studentId !== id);
  s.attendance = s.attendance.filter((a) => a.studentId !== id);
  s.payments = s.payments.filter((p) => p.studentId !== id);
  save(s);
}

// ====== Groups ======
export function getGroups() {
  const s = load();
  return s.groups
    .map((g) => ({
      ...g,
      schedules: s.groupSchedules.filter((sc) => sc.groupId === g.id),
      studentCount: s.enrollments.filter((e) => e.groupId === g.id).length,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGroupById(id: number) {
  const s = load();
  const g = s.groups.find((gr) => gr.id === id);
  if (!g) return null;
  return {
    ...g,
    schedules: s.groupSchedules.filter((sc) => sc.groupId === id),
    students: s.enrollments
      .filter((e) => e.groupId === id)
      .map((e) => {
        const st = s.students.find((x) => x.id === e.studentId);
        return {
          enrollmentId: e.id,
          studentId: e.studentId,
          studentName: st?.name || "",
          studentPhone: st?.phone || null,
          grade: st?.grade || null,
          isActive: e.isActive,
          enrolledAt: e.enrolledAt,
        };
      }),
  };
}

export function addGroup(data: {
  name: string;
  subject: string;
  grade?: string;
  monthlyFee?: number;
  maxStudents?: number;
  notes?: string;
  schedules?: { dayOfWeek: string; startTime: string; endTime: string }[];
}): Group {
  const s = load();
  const group: Group = {
    id: s.counters.groups++,
    name: data.name,
    subject: data.subject,
    grade: data.grade || null,
    monthlyFee: (data.monthlyFee || 0).toString(),
    maxStudents: data.maxStudents ?? 20,
    notes: data.notes || null,
    isActive: true,
    createdAt: now(),
  };
  s.groups.push(group);
  if (data.schedules) {
    for (const sch of data.schedules) {
      s.groupSchedules.push({
        id: s.counters.groupSchedules++,
        groupId: group.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
      });
    }
  }
  save(s);
  return group;
}

export function updateGroup(
  id: number,
  data: {
    name?: string;
    subject?: string;
    grade?: string;
    monthlyFee?: string;
    maxStudents?: number;
    notes?: string;
    isActive?: boolean;
    schedules?: { dayOfWeek: string; startTime: string; endTime: string }[];
  }
) {
  const s = load();
  const idx = s.groups.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  const g = s.groups[idx];
  if (data.name !== undefined) g.name = data.name;
  if (data.subject !== undefined) g.subject = data.subject;
  if (data.grade !== undefined) g.grade = data.grade;
  if (data.monthlyFee !== undefined) g.monthlyFee = data.monthlyFee;
  if (data.maxStudents !== undefined) g.maxStudents = data.maxStudents;
  if (data.notes !== undefined) g.notes = data.notes;
  if (data.isActive !== undefined) g.isActive = data.isActive;
  if (data.schedules !== undefined) {
    s.groupSchedules = s.groupSchedules.filter((sc) => sc.groupId !== id);
    for (const sch of data.schedules) {
      s.groupSchedules.push({
        id: s.counters.groupSchedules++,
        groupId: id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
      });
    }
  }
  save(s);
  return g;
}

export function removeGroup(id: number) {
  const s = load();
  s.groups = s.groups.filter((g) => g.id !== id);
  s.groupSchedules = s.groupSchedules.filter((sc) => sc.groupId !== id);
  s.enrollments = s.enrollments.filter((e) => e.groupId !== id);
  s.sessions = s.sessions.filter((se) => se.groupId !== id);
  s.payments = s.payments.filter((p) => p.groupId !== id);
  save(s);
}

// ====== Enrollments ======
export function addEnrollment(studentId: number, groupId: number) {
  const s = load();
  const existing = s.enrollments.find(
    (e) => e.studentId === studentId && e.groupId === groupId
  );
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      save(s);
      return { ok: true, enrollment: existing };
    }
    return { ok: false, error: "الطالب مسجل بالفعل في هذه المجموعة" };
  }
  const enrollment: Enrollment = {
    id: s.counters.enrollments++,
    studentId,
    groupId,
    enrolledAt: now(),
    isActive: true,
  };
  s.enrollments.push(enrollment);
  save(s);
  return { ok: true, enrollment };
}

export function removeEnrollment(studentId: number, groupId: number) {
  const s = load();
  s.enrollments = s.enrollments.filter(
    (e) => !(e.studentId === studentId && e.groupId === groupId)
  );
  save(s);
}

// ====== Sessions ======
export function getSessions(filters: { from?: string; to?: string; groupId?: number }) {
  const s = load();
  let list = [...s.sessions];
  if (filters.groupId) list = list.filter((se) => se.groupId === filters.groupId);
  if (filters.from) list = list.filter((se) => se.sessionDate >= filters.from!);
  if (filters.to) list = list.filter((se) => se.sessionDate <= filters.to!);
  return list
    .map((se) => {
      const g = s.groups.find((gr) => gr.id === se.groupId);
      return { ...se, groupName: g?.name || "", subject: g?.subject || "" };
    })
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
}

export function addSession(data: {
  groupId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  const s = load();
  const session: Session = {
    id: s.counters.sessions++,
    groupId: data.groupId,
    sessionDate: data.sessionDate,
    startTime: data.startTime,
    endTime: data.endTime,
    notes: data.notes || null,
    createdAt: now(),
  };
  s.sessions.push(session);
  const enrolled = s.enrollments.filter((e) => e.groupId === data.groupId && e.isActive);
  for (const e of enrolled) {
    s.attendance.push({
      id: s.counters.attendance++,
      sessionId: session.id,
      studentId: e.studentId,
      status: "حاضر",
      notes: null,
    });
  }
  save(s);
  return session;
}

export function removeSession(id: number) {
  const s = load();
  s.sessions = s.sessions.filter((se) => se.id !== id);
  s.attendance = s.attendance.filter((a) => a.sessionId !== id);
  save(s);
}

// ====== Attendance ======
export function getAttendance(sessionId: number) {
  const s = load();
  return s.attendance
    .filter((a) => a.sessionId === sessionId)
    .map((a) => {
      const st = s.students.find((x) => x.id === a.studentId);
      return { ...a, studentName: st?.name || "", studentPhone: st?.phone || null };
    });
}

export function updateAttendance(id: number, data: { status?: string; notes?: string | null }) {
  const s = load();
  const idx = s.attendance.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  if (data.status !== undefined) s.attendance[idx].status = data.status;
  if (data.notes !== undefined) s.attendance[idx].notes = data.notes;
  save(s);
  return s.attendance[idx];
}

// ====== Payments ======
export function getPayments(filters: { month?: string; studentId?: number; groupId?: number }) {
  const s = load();
  let list = [...s.payments];
  if (filters.month) list = list.filter((p) => p.month === filters.month);
  if (filters.studentId) list = list.filter((p) => p.studentId === filters.studentId);
  if (filters.groupId) list = list.filter((p) => p.groupId === filters.groupId);
  return list
    .map((p) => {
      const st = s.students.find((x) => x.id === p.studentId);
      const g = s.groups.find((gr) => gr.id === p.groupId);
      return { ...p, studentName: st?.name || "", groupName: g?.name || "" };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addPayment(data: {
  studentId: number;
  groupId: number;
  amount: number;
  month: string;
  status?: string;
  notes?: string;
}) {
  const s = load();
  const payment: Payment = {
    id: s.counters.payments++,
    studentId: data.studentId,
    groupId: data.groupId,
    amount: data.amount.toString(),
    month: data.month,
    status: data.status || "مدفوع",
    paidAt: data.status === "مدفوع" ? now() : null,
    notes: data.notes || null,
    createdAt: now(),
  };
  s.payments.push(payment);
  save(s);
  return payment;
}

export function updatePayment(id: number, data: { amount?: string; status?: string; notes?: string | null }) {
  const s = load();
  const idx = s.payments.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const p = s.payments[idx];
  if (data.amount !== undefined) p.amount = data.amount;
  if (data.status !== undefined) {
    p.status = data.status;
    p.paidAt = data.status === "مدفوع" ? now() : null;
  }
  if (data.notes !== undefined) p.notes = data.notes;
  save(s);
  return p;
}

export function removePayment(id: number) {
  const s = load();
  s.payments = s.payments.filter((p) => p.id !== id);
  save(s);
}

// ====== Dashboard ======
export function getDashboard() {
  const s = load();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = `${currentMonth}-01`;

  const totalStudents = s.students.filter((st) => st.isActive).length;
  const totalGroups = s.groups.filter((g) => g.isActive).length;
  const totalSessions = s.sessions.filter((se) => se.sessionDate >= startOfMonth).length;

  const monthPayments = s.payments.filter((p) => p.month === currentMonth);
  const monthRevenue = monthPayments
    .filter((p) => p.status === "مدفوع")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const unpaidCount = monthPayments.filter((p) => p.status === "غير مدفوع").length;

  const recentPayments = s.payments
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((p) => {
      const st = s.students.find((x) => x.id === p.studentId);
      return {
        id: p.id,
        studentName: st?.name || "",
        amount: p.amount,
        status: p.status,
        month: p.month,
        paidAt: p.paidAt,
      };
    });

  return {
    totalStudents,
    totalGroups,
    totalSessions,
    monthRevenue,
    unpaidCount,
    currentMonth,
    recentPayments,
  };
}
