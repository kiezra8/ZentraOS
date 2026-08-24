import {
  DEMO_INSTITUTIONS,
  DEMO_ACADEMIC_YEARS,
  DEMO_TERMS,
  DEMO_CLASSES,
  DEMO_STREAMS,
  DEMO_SUBJECTS,
  DEMO_STAFF,
  DEMO_PARENTS,
  DEMO_STUDENTS,
  DEMO_PARENT_STUDENTS,
  DEMO_EXAMS,
  DEMO_MARKS,
  DEMO_GRADING_SYSTEM,
  DEMO_FEE_STRUCTURES,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_ATTENDANCE_SESSIONS,
  DEMO_ATTENDANCE_RECORDS,
  DEMO_AUDIT_LOGS,
} from './mockData'
import type {
  Institution,
  Student,
  Parent,
  Staff,
  AcademicYear,
  Term,
  Class,
  Stream,
  Subject,
  AttendanceSession,
  AttendanceRecord,
  Exam,
  StudentMark,
  GradingSystem,
  FeeStructure,
  StudentInvoice,
  Payment,
  Receipt,
  AuditLog,
} from '@/types'
import { db, enqueueSync } from './dexie'
import { generateId, generateReceiptNumber } from './utils'

// In-Memory state initialised from localStorage or Mock data
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`zentraos_${key}`)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(`zentraos_${key}`, JSON.stringify(data))
  } catch (e) {
    console.error('LocalStorage write failed:', e)
  }
}

// Stores
let institutions = loadLocal<Institution[]>('institutions', DEMO_INSTITUTIONS)
let students = loadLocal<Student[]>('students', DEMO_STUDENTS)
let parents = loadLocal<Parent[]>('parents', DEMO_PARENTS)
let staff = loadLocal<Staff[]>('staff', DEMO_STAFF)
let academicYears = loadLocal<AcademicYear[]>('academic_years', DEMO_ACADEMIC_YEARS)
let terms = loadLocal<Term[]>('terms', DEMO_TERMS)
let classes = loadLocal<Class[]>('classes', DEMO_CLASSES)
let streams = loadLocal<Stream[]>('streams', DEMO_STREAMS)
let subjects = loadLocal<Subject[]>('subjects', DEMO_SUBJECTS)
let exams = loadLocal<Exam[]>('exams', DEMO_EXAMS)
let marks = loadLocal<StudentMark[]>('marks', DEMO_MARKS)
let gradingSystems = loadLocal<GradingSystem[]>('grading_systems', [DEMO_GRADING_SYSTEM])
let feeStructures = loadLocal<FeeStructure[]>('fee_structures', DEMO_FEE_STRUCTURES)
let invoices = loadLocal<StudentInvoice[]>('invoices', DEMO_INVOICES)
let payments = loadLocal<Payment[]>('payments', DEMO_PAYMENTS)
let attendanceSessions = loadLocal<AttendanceSession[]>('attendance_sessions', DEMO_ATTENDANCE_SESSIONS)
let attendanceRecords = loadLocal<AttendanceRecord[]>('attendance_records', DEMO_ATTENDANCE_RECORDS)
let auditLogs = loadLocal<AuditLog[]>('audit_logs', DEMO_AUDIT_LOGS)

export const DataService = {
  // ---- INSTITUTIONS ----
  getInstitutions: () => [...institutions],
  getInstitutionById: (id: string) => institutions.find(i => i.id === id),
  createInstitution: (inst: Omit<Institution, 'id' | 'created_at' | 'updated_at'>): Institution => {
    const newInst: Institution = {
      ...inst,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    institutions = [newInst, ...institutions]
    saveLocal('institutions', institutions)
    return newInst
  },
  updateInstitution: (id: string, updates: Partial<Institution>): Institution | null => {
    const idx = institutions.findIndex(i => i.id === id)
    if (idx === -1) return null
    institutions[idx] = { ...institutions[idx], ...updates, updated_at: new Date().toISOString() }
    saveLocal('institutions', institutions)
    return institutions[idx]
  },

  // ---- STUDENTS ----
  getStudents: (institutionId?: string): (Student & { current_class?: Class; current_stream?: Stream })[] => {
    const list = institutionId ? students.filter(s => s.institution_id === institutionId) : students
    return list.map(s => ({
      ...s,
      current_class: classes.find(c => c.id === s.current_class_id),
      current_stream: streams.find(st => st.id === s.current_stream_id),
    }))
  },
  getStudentById: (id: string) => {
    const s = students.find(item => item.id === id)
    if (!s) return null
    return {
      ...s,
      current_class: classes.find(c => c.id === s.current_class_id),
      current_stream: streams.find(st => st.id === s.current_stream_id),
    }
  },
  createStudent: async (data: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    const newStudent: Student = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    students = [newStudent, ...students]
    saveLocal('students', students)
    await db.students.put(newStudent)
    await enqueueSync('students', 'insert', newStudent.id, newStudent as unknown as Record<string, unknown>)
    
    // Add audit log
    DataService.addAuditLog({
      institution_id: data.institution_id,
      user_id: 'usr-admin',
      action: 'Admitted New Student',
      table_name: 'students',
      record_id: newStudent.id,
      new_values: { admission_number: newStudent.admission_number, name: `${newStudent.first_name} ${newStudent.last_name}` },
    })

    return newStudent
  },
  updateStudent: async (id: string, updates: Partial<Student>): Promise<Student | null> => {
    const idx = students.findIndex(s => s.id === id)
    if (idx === -1) return null
    students[idx] = { ...students[idx], ...updates, updated_at: new Date().toISOString() }
    saveLocal('students', students)
    await db.students.put(students[idx])
    await enqueueSync('students', 'update', id, updates as Record<string, unknown>)
    return students[idx]
  },
  deleteStudent: async (id: string): Promise<boolean> => {
    const target = students.find(s => s.id === id)
    if (!target) return false
    students = students.filter(s => s.id !== id)
    saveLocal('students', students)
    await db.students.delete(id)
    await enqueueSync('students', 'delete', id, { id })
    return true
  },

  // ---- PARENTS ----
  getParents: (institutionId?: string) => {
    return institutionId ? parents.filter(p => p.institution_id === institutionId) : parents
  },
  createParent: (data: Omit<Parent, 'id' | 'created_at'>): Parent => {
    const newParent: Parent = { ...data, id: generateId(), created_at: new Date().toISOString() }
    parents = [newParent, ...parents]
    saveLocal('parents', parents)
    return newParent
  },
  updateParent: (id: string, updates: Partial<Parent>): Parent | null => {
    const idx = parents.findIndex(p => p.id === id)
    if (idx === -1) return null
    parents[idx] = { ...parents[idx], ...updates }
    saveLocal('parents', parents)
    return parents[idx]
  },

  // ---- STAFF ----
  getStaff: (institutionId?: string) => {
    return institutionId ? staff.filter(s => s.institution_id === institutionId) : staff
  },
  createStaff: (data: Omit<Staff, 'id' | 'created_at'>): Staff => {
    const newStaff: Staff = { ...data, id: generateId(), created_at: new Date().toISOString() }
    staff = [newStaff, ...staff]
    saveLocal('staff', staff)
    return newStaff
  },
  updateStaff: (id: string, updates: Partial<Staff>): Staff | null => {
    const idx = staff.findIndex(s => s.id === id)
    if (idx === -1) return null
    staff[idx] = { ...staff[idx], ...updates }
    saveLocal('staff', staff)
    return staff[idx]
  },

  // ---- ACADEMIC YEARS & TERMS ----
  getAcademicYears: (institutionId?: string) => {
    return institutionId ? academicYears.filter(ay => ay.institution_id === institutionId) : academicYears
  },
  createAcademicYear: (data: Omit<AcademicYear, 'id' | 'created_at'>): AcademicYear => {
    const newYear: AcademicYear = { ...data, id: generateId(), created_at: new Date().toISOString() }
    academicYears = [newYear, ...academicYears]
    saveLocal('academic_years', academicYears)
    return newYear
  },
  getTerms: (academicYearId?: string) => {
    return academicYearId ? terms.filter(t => t.academic_year_id === academicYearId) : terms
  },
  createTerm: (data: Omit<Term, 'id'>): Term => {
    const newTerm: Term = { ...data, id: generateId() }
    terms = [newTerm, ...terms]
    saveLocal('terms', terms)
    return newTerm
  },

  // ---- CLASSES & STREAMS ----
  getClasses: (institutionId?: string) => {
    const list = institutionId ? classes.filter(c => c.institution_id === institutionId) : classes
    return list.map(c => ({
      ...c,
      streams: streams.filter(s => s.class_id === c.id),
      studentCount: students.filter(s => s.current_class_id === c.id).length,
    }))
  },
  createClass: (data: Omit<Class, 'id' | 'created_at'>): Class => {
    const newClass: Class = { ...data, id: generateId(), created_at: new Date().toISOString() }
    classes = [newClass, ...classes]
    saveLocal('classes', classes)
    return newClass
  },
  getStreams: (classId?: string) => {
    return classId ? streams.filter(s => s.class_id === classId) : streams
  },
  createStream: (data: Omit<Stream, 'id' | 'created_at'>): Stream => {
    const newStream: Stream = { ...data, id: generateId(), created_at: new Date().toISOString() }
    streams = [newStream, ...streams]
    saveLocal('streams', streams)
    return newStream
  },

  // ---- SUBJECTS ----
  getSubjects: (institutionId?: string) => {
    return institutionId ? subjects.filter(s => s.institution_id === institutionId) : subjects
  },
  createSubject: (data: Omit<Subject, 'id' | 'created_at'>): Subject => {
    const newSubject: Subject = { ...data, id: generateId(), created_at: new Date().toISOString() }
    subjects = [newSubject, ...subjects]
    saveLocal('subjects', subjects)
    return newSubject
  },

  // ---- ATTENDANCE ----
  getAttendanceSessions: (classId?: string, date?: string) => {
    return attendanceSessions.filter(s => {
      if (classId && s.class_id !== classId) return false
      if (date && s.date !== date) return false
      return true
    })
  },
  getAttendanceRecords: (sessionId: string) => {
    return attendanceRecords.filter(r => r.session_id === sessionId)
  },
  saveAttendanceSession: async (
    sessionData: Omit<AttendanceSession, 'id' | 'created_at'>,
    recordsData: { student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }[]
  ): Promise<AttendanceSession> => {
    // Check if session already exists for class & date
    let existingSession = attendanceSessions.find(
      s => s.class_id === sessionData.class_id && s.date === sessionData.date && s.period === sessionData.period
    )

    let sessionId = existingSession?.id
    if (!existingSession) {
      existingSession = {
        ...sessionData,
        id: generateId(),
        created_at: new Date().toISOString(),
      }
      attendanceSessions = [existingSession, ...attendanceSessions]
      saveLocal('attendance_sessions', attendanceSessions)
      sessionId = existingSession.id
    }

    // Replace/Insert records
    const newRecords: AttendanceRecord[] = recordsData.map(r => ({
      id: generateId(),
      session_id: sessionId!,
      student_id: r.student_id,
      status: r.status,
      notes: r.notes,
      created_at: new Date().toISOString(),
    }))

    attendanceRecords = [
      ...attendanceRecords.filter(r => r.session_id !== sessionId),
      ...newRecords,
    ]
    saveLocal('attendance_records', attendanceRecords)

    // Save offline Dexie
    await db.attendance_sessions.put(existingSession)
    await db.attendance_records.bulkPut(newRecords)
    await enqueueSync('attendance', 'insert', sessionId!, { session: existingSession, records: newRecords })

    return existingSession
  },

  // ---- EXAMS & MARKS ----
  getExams: (institutionId?: string) => {
    const list = institutionId ? exams.filter(e => e.institution_id === institutionId) : exams
    return list.map(e => ({
      ...e,
      class: classes.find(c => c.id === e.class_id),
      subject: subjects.find(s => s.id === e.subject_id),
    }))
  },
  createExam: (data: Omit<Exam, 'id' | 'created_at'>): Exam => {
    const newExam: Exam = { ...data, id: generateId(), created_at: new Date().toISOString() }
    exams = [newExam, ...exams]
    saveLocal('exams', exams)
    return newExam
  },
  getMarksByExam: (examId: string) => {
    return marks.filter(m => m.exam_id === examId).map(m => ({
      ...m,
      student: students.find(s => s.id === m.student_id),
    }))
  },
  saveMarks: async (examId: string, marksList: { student_id: string; marks_obtained: number; grade?: string; remarks?: string }[]) => {
    const newMarks: StudentMark[] = marksList.map(m => ({
      id: generateId(),
      exam_id: examId,
      student_id: m.student_id,
      marks_obtained: m.marks_obtained,
      grade: m.grade,
      remarks: m.remarks,
      entered_by: 'usr-teacher',
      entered_at: new Date().toISOString(),
      is_published: true,
    }))

    marks = [...marks.filter(m => m.exam_id !== examId), ...newMarks]
    saveLocal('marks', marks)
    await db.student_marks.bulkPut(newMarks)
    await enqueueSync('student_marks', 'update', examId, { marks: newMarks })

    return newMarks
  },
  getGradingSystems: (institutionId?: string) => {
    return institutionId ? gradingSystems.filter(g => g.institution_id === institutionId) : gradingSystems
  },

  // ---- FEES & FINANCE ----
  getFeeStructures: (institutionId?: string) => {
    return institutionId ? feeStructures.filter(f => f.institution_id === institutionId) : feeStructures
  },
  createFeeStructure: (data: Omit<FeeStructure, 'id' | 'created_at'>): FeeStructure => {
    const newFee: FeeStructure = { ...data, id: generateId(), created_at: new Date().toISOString() }
    feeStructures = [newFee, ...feeStructures]
    saveLocal('fee_structures', feeStructures)
    return newFee
  },
  getInvoices: (institutionId?: string) => {
    const list = institutionId ? invoices.filter(i => i.institution_id === institutionId) : invoices
    return list.map(inv => ({
      ...inv,
      student: students.find(s => s.id === inv.student_id),
      payments: payments.filter(p => p.invoice_id === inv.id),
    }))
  },
  createInvoice: (data: Omit<StudentInvoice, 'id' | 'created_at' | 'total_paid' | 'balance' | 'total_amount' | 'items'> & { items: { description: string; amount: number; fee_structure_id?: string }[] }): StudentInvoice => {
    const total_amount = data.items.reduce((sum, item) => sum + item.amount, 0)
    const invoiceId = generateId()
    const invoiceItems = data.items.map(item => ({
      id: generateId(),
      invoice_id: invoiceId,
      fee_structure_id: item.fee_structure_id,
      description: item.description,
      amount: item.amount,
    }))
    const newInvoice: StudentInvoice = {
      ...data,
      id: invoiceId,
      total_amount,
      total_paid: 0,
      balance: total_amount,
      status: 'outstanding',
      created_at: new Date().toISOString(),
      items: invoiceItems,
    }
    invoices = [newInvoice, ...invoices]
    saveLocal('invoices', invoices)
    return newInvoice
  },
  getPayments: (institutionId?: string) => {
    const list = institutionId ? payments.filter(p => p.institution_id === institutionId) : payments
    return list.map(pay => ({
      ...pay,
      student: students.find(s => s.id === pay.student_id),
    }))
  },
  recordPayment: (data: Omit<Payment, 'id' | 'created_at' | 'receipt'>): Payment => {
    const receiptNumber = generateReceiptNumber(payments.length + 1)
    const newReceipt: Receipt = {
      id: generateId(),
      payment_id: '',
      receipt_number: receiptNumber,
      issued_at: new Date().toISOString(),
      issued_by: 'Grace Atuhaire (Bursar)',
    }

    const newPayment: Payment = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      receipt: {
        ...newReceipt,
        payment_id: generateId(),
      },
    }

    payments = [newPayment, ...payments]
    saveLocal('payments', payments)

    // Update invoice total_paid & balance
    const invIdx = invoices.findIndex(i => i.id === data.invoice_id)
    if (invIdx !== -1) {
      const inv = invoices[invIdx]
      const total_paid = inv.total_paid + data.amount
      const balance = Math.max(0, inv.total_amount - total_paid)
      const status = balance === 0 ? 'paid' : total_paid > 0 ? 'partial' : 'outstanding'
      invoices[invIdx] = { ...inv, total_paid, balance, status }
      saveLocal('invoices', invoices)
    }

    // Add Audit Log
    DataService.addAuditLog({
      institution_id: data.institution_id,
      user_id: 'usr-bursar',
      action: 'Payment Recorded',
      table_name: 'payments',
      record_id: newPayment.id,
      new_values: { amount: data.amount, receipt: receiptNumber, payment_method: data.payment_method },
    })

    return newPayment
  },

  // ---- AUDIT LOGS ----
  getAuditLogs: (institutionId?: string) => {
    return institutionId ? auditLogs.filter(a => a.institution_id === institutionId) : auditLogs
  },
  addAuditLog: (log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog => {
    const newLog: AuditLog = {
      ...log,
      id: generateId(),
      created_at: new Date().toISOString(),
    }
    auditLogs = [newLog, ...auditLogs]
    saveLocal('audit_logs', auditLogs)
    return newLog
  },

  // ---- SYSTEM STATS ----
  getStats: (institutionId?: string) => {
    const instStudents = institutionId ? students.filter(s => s.institution_id === institutionId) : students
    const instStaff = institutionId ? staff.filter(s => s.institution_id === institutionId) : staff
    const instInvoices = institutionId ? invoices.filter(i => i.institution_id === institutionId) : invoices
    const instPayments = institutionId ? payments.filter(p => p.institution_id === institutionId) : payments

    const totalStudents = instStudents.length
    const activeStudents = instStudents.filter(s => s.status === 'active').length
    const totalStaff = instStaff.length
    const totalBilled = instInvoices.reduce((sum, i) => sum + i.total_amount, 0)
    const totalCollected = instPayments.reduce((sum, p) => sum + p.amount, 0)
    const outstandingFees = Math.max(0, totalBilled - totalCollected)
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

    return {
      totalStudents,
      activeStudents,
      totalStaff,
      totalBilled,
      totalCollected,
      outstandingFees,
      collectionRate,
    }
  },
}
