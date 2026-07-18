import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

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

const DATA_FILE = join(process.cwd(), "data.json");

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

let _store: DataStore | null = null;

function load(): DataStore {
  if (_store) return _store;
  if (existsSync(DATA_FILE)) {
    try {
      _store = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
    } catch {
      _store = { ...defaultData };
    }
  } else {
    _store = { ...defaultData };
  }
  return _store!;
}

function save() {
  writeFileSync(DATA_FILE, JSON.stringify(_store, null, 2), "utf-8");
}

function nextId(table: keyof Omit<DataStore, "counters">): number {
  const s = load();
  const id = s.counters[table];
  s.counters[table] = id + 1;
  return id;
}

function now() {
  return new Date().toISOString();
}

// Students
export function getAllStudents(search?: string): Student[] {
  const s = load();
  let list = [...s.students];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        (st.phone && st.phone.includes(q))
    );
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStudent(id: number): Student | undefined {
  return load().students.find((s) => s.id === id);
}

export function createStudent(data: Omit<Student, "id" | "createdAt">): Student {
  const s = load();
  const student: Student = { ...data, id: nextId("students"), createdAt: now() };
  s.students.push(student);
  save();
  return student;
}

export function updateStudent(id: number, data: Partial<Student>): Student | undefined {
  const s = load();
  const idx = s.students.findIndex((st) => st.id === id);
  if (idx === -1) return undefined;
  s.students[idx] = { ...s.students[idx], ...data };
  save();
  return s.students[idx];
}

export function deleteStudent(id: number) {
  const s = load();
  s.students = s.students.filter((st) => st.id !== id);
  s.enrollments = s.enrollments.filter((e) => e.studentId !== id);
  s.attendance = s.attendance.filter((a) => a.studentId !== id);
  s.payments = s.payments.filter((p) => p.studentId !== id);
  save();
}

// Groups
export function getAllGroups(): (Group & { schedules: GroupSchedule[]; studentCount: number })[] {
  const s = load();
  return s.groups
    .map((g) => ({
      ...g,
      schedules: s.groupSchedules.filter((sc) => sc.groupId === g.id),
      studentCount: s.enrollments.filter((e) => e.groupId === g.id).length,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGroup(id: number) {
  const s = load();
  const g = s.groups.find((gr) => gr.id === id);
  if (!g) return undefined;
  return {
    ...g,
    schedules: s.groupSchedules.filter((sc) => sc.groupId === id),
    students: s.enrollments
      .filter((e) => e.groupId === id)
      .map((e) => {
        const st = s.students.find((s) => s.id === e.studentId);
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

export function createGroup(data: {
  name: string;
  subject: string;
  grade?: string | null;
  monthlyFee?: string;
  maxStudents?: number;
  notes?: string | null;
  schedules?: { dayOfWeek: string; startTime: string; endTime: string }[];
}): Group {
  const s = load();
  const group: Group = {
    id: nextId("groups"),
    name: data.name,
    subject: data.subject,
    grade: data.grade ?? null,
    monthlyFee: data.monthlyFee || "0",
    maxStudents: data.maxStudents ?? 20,
    notes: data.notes ?? null,
    isActive: true,
    createdAt: now(),
  };
  s.groups.push(group);
  if (data.schedules) {
    for (const sch of data.schedules) {
      s.groupSchedules.push({
        id: nextId("groupSchedules"),
        groupId: group.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
      });
    }
  }
  save();
  return group;
}

export function updateGroup(
  id: number,
  data: {
    name?: string;
    subject?: string;
    grade?: string | null;
    monthlyFee?: string;
    maxStudents?: number;
    notes?: string | null;
    isActive?: boolean;
    schedules?: { dayOfWeek: string; startTime: string; endTime: string }[];
  }
): Group | undefined {
  const s = load();
  const idx = s.groups.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
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
        id: nextId("groupSchedules"),
        groupId: id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
      });
    }
  }
  save();
  return g;
}

export function deleteGroup(id: number) {
  const s = load();
  s.groups = s.groups.filter((g) => g.id !== id);
  s.groupSchedules = s.groupSchedules.filter((sc) => sc.groupId !== id);
  s.enrollments = s.enrollments.filter((e) => e.groupId !== id);
  s.sessions = s.sessions.filter((se) => se.groupId !== id);
  s.payments = s.payments.filter((p) => p.groupId !== id);
  save();
}

// Enrollments
export function createEnrollment(studentId: number, groupId: number): { enrollment: Enrollment; reactivated: boolean } | { error: string } {
  const s = load();
  const existing = s.enrollments.find(
    (e) => e.studentId === studentId && e.groupId === groupId
  );
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      save();
      return { enrollment: existing, reactivated: true };
    }
    return { error: "الطالب مسجل بالفعل في هذه المجموعة" };
  }
  const enrollment: Enrollment = {
    id: nextId("enrollments"),
    studentId,
    groupId,
    enrolledAt: now(),
    isActive: true,
  };
  s.enrollments.push(enrollment);
  save();
  return { enrollment, reactivated: false };
}

export function deleteEnrollment(studentId: number, groupId: number) {
  const s = load();
  s.enrollments = s.enrollments.filter(
    (e) => !(e.studentId === studentId && e.groupId === groupId)
  );
  save();
}

// Sessions
export function getAllSessions(from?: string, to?: string, groupId?: number): (Session & { groupName: string; subject: string })[] {
  const s = load();
  let list = [...s.sessions];
  if (groupId) list = list.filter((se) => se.groupId === groupId);
  if (from) list = list.filter((se) => se.sessionDate >= from);
  if (to) list = list.filter((se) => se.sessionDate <= to);
  return list
    .map((se) => {
      const g = s.groups.find((gr) => gr.id === se.groupId);
      return { ...se, groupName: g?.name || "", subject: g?.subject || "" };
    })
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
}

export function createSession(data: {
  groupId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}): Session {
  const s = load();
  const session: Session = {
    id: nextId("sessions"),
    groupId: data.groupId,
    sessionDate: data.sessionDate,
    startTime: data.startTime,
    endTime: data.endTime,
    notes: data.notes ?? null,
    createdAt: now(),
  };
  s.sessions.push(session);

  // Auto-create attendance for enrolled students
  const enrolled = s.enrollments.filter(
    (e) => e.groupId === data.groupId && e.isActive
  );
  for (const e of enrolled) {
    s.attendance.push({
      id: nextId("attendance"),
      sessionId: session.id,
      studentId: e.studentId,
      status: "حاضر",
      notes: null,
    });
  }
  save();
  return session;
}

export function deleteSession(id: number) {
  const s = load();
  s.sessions = s.sessions.filter((se) => se.id !== id);
  s.attendance = s.attendance.filter((a) => a.sessionId !== id);
  save();
}

// Attendance
export function getAttendance(sessionId: number) {
  const s = load();
  return s.attendance
    .filter((a) => a.sessionId === sessionId)
    .map((a) => {
      const st = s.students.find((st) => st.id === a.studentId);
      return {
        ...a,
        studentName: st?.name || "",
        studentPhone: st?.phone || null,
      };
    });
}

export function updateAttendance(id: number, data: { status?: string; notes?: string | null }) {
  const s = load();
  const idx = s.attendance.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  if (data.status !== undefined) s.attendance[idx].status = data.status;
  if (data.notes !== undefined) s.attendance[idx].notes = data.notes;
  save();
  return s.attendance[idx];
}

// Payments
export function getAllPayments(filters: { month?: string; studentId?: number; groupId?: number }) {
  const s = load();
  let list = [...s.payments];
  if (filters.month) list = list.filter((p) => p.month === filters.month);
  if (filters.studentId) list = list.filter((p) => p.studentId === filters.studentId);
  if (filters.groupId) list = list.filter((p) => p.groupId === filters.groupId);
  return list
    .map((p) => {
      const st = s.students.find((s) => s.id === p.studentId);
      const g = s.groups.find((gr) => gr.id === p.groupId);
      return {
        ...p,
        studentName: st?.name || "",
        groupName: g?.name || "",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPayment(data: {
  studentId: number;
  groupId: number;
  amount: string;
  month: string;
  status?: string;
  notes?: string | null;
}): Payment {
  const s = load();
  const payment: Payment = {
    id: nextId("payments"),
    studentId: data.studentId,
    groupId: data.groupId,
    amount: data.amount,
    month: data.month,
    status: data.status || "مدفوع",
    paidAt: data.status === "مدفوع" ? now() : null,
    notes: data.notes ?? null,
    createdAt: now(),
  };
  s.payments.push(payment);
  save();
  return payment;
}

export function updatePayment(
  id: number,
  data: { amount?: string; status?: string; notes?: string | null }
): Payment | undefined {
  const s = load();
  const idx = s.payments.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const p = s.payments[idx];
  if (data.amount !== undefined) p.amount = data.amount;
  if (data.status !== undefined) {
    p.status = data.status;
    p.paidAt = data.status === "مدفوع" ? now() : null;
  }
  if (data.notes !== undefined) p.notes = data.notes;
  save();
  return p;
}

export function deletePayment(id: number) {
  const s = load();
  s.payments = s.payments.filter((p) => p.id !== id);
  save();
}

// Dashboard
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
      const st = s.students.find((s) => s.id === p.studentId);
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

// Student details (with enrollments and payments)
export function getStudentDetails(id: number) {
  const s = load();
  const student = s.students.find((st) => st.id === id);
  if (!student) return undefined;

  const enrollments = s.enrollments
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
    });

  const payments = s.payments
    .filter((p) => p.studentId === id)
    .map((p) => ({
      id: p.id,
      amount: p.amount,
      month: p.month,
      status: p.status,
      paidAt: p.paidAt,
      groupId: p.groupId,
      notes: p.notes,
    }));

  return { ...student, enrollments, payments };
}
