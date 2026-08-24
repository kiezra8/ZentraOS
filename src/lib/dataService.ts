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
  DEMO_TEACHERS_ON_DUTY,
  DEMO_DAILY_SPECIAL_DUTIES,
  DEMO_CLASS_ACTIVITIES,
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
  TeacherOnDuty,
  DailySpecialDuty,
  ClassActivity,
  DutyStatus,
  ActivityAssessmentStatus,
  AttendanceStatus,
} from '@/types'
import { db, enqueueSync } from './dexie'
import { generateId, generateReceiptNumber, formatCurrency } from './utils'

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
let teachersOnDuty = loadLocal<TeacherOnDuty[]>('teachers_on_duty', DEMO_TEACHERS_ON_DUTY)
let dailySpecialDuties = loadLocal<DailySpecialDuty[]>('daily_special_duties', DEMO_DAILY_SPECIAL_DUTIES)
let classActivities = loadLocal<ClassActivity[]>('class_activities', DEMO_CLASS_ACTIVITIES)

export interface ClassAttendanceSummary {
  class_id: string
  class_name: string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  attendance_rate: number
  students: Array<{
    student: Student
    status: AttendanceStatus
    notes?: string
  }>
}

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

    await db.attendance_sessions.put(existingSession)
    await db.attendance_records.bulkPut(newRecords)
    await enqueueSync('attendance', 'insert', sessionId!, { session: existingSession, records: newRecords })

    return existingSession
  },

  // Per-Class Attendance Breakdown Calculation
  getClassAttendanceBreakdown: (institutionId?: string): ClassAttendanceSummary[] => {
    const instClasses = DataService.getClasses(institutionId)
    const instStudents = DataService.getStudents(institutionId)

    return instClasses.map(cls => {
      const classStudents = instStudents.filter(s => s.current_class_id === cls.id)
      const studentItems = classStudents.map(student => {
        const record = attendanceRecords.find(r => r.student_id === student.id)
        const status: AttendanceStatus = record ? record.status : 'present' // default present for demo
        return {
          student,
          status,
          notes: record?.notes,
        }
      })

      const present_count = studentItems.filter(i => i.status === 'present').length
      const late_count = studentItems.filter(i => i.status === 'late').length
      const absent_count = studentItems.filter(i => i.status === 'absent').length
      const excused_count = studentItems.filter(i => i.status === 'excused').length
      const total = studentItems.length

      const attendance_rate = total > 0 ? Math.round(((present_count + late_count) / total) * 100) : 100

      return {
        class_id: cls.id,
        class_name: cls.name,
        total_students: total,
        present_count,
        absent_count,
        late_count,
        excused_count,
        attendance_rate,
        students: studentItems,
      }
    })
  },

  // ---- TEACHERS ON DUTY (TOD) ----
  getTeachersOnDuty: (institutionId?: string): TeacherOnDuty[] => {
    return institutionId ? teachersOnDuty.filter(t => t.institution_id === institutionId) : teachersOnDuty
  },

  // ---- DAILY SPECIAL DUTIES ----
  getDailySpecialDuties: (institutionId?: string): DailySpecialDuty[] => {
    return institutionId ? dailySpecialDuties.filter(d => d.institution_id === institutionId) : dailySpecialDuties
  },
  updateDailySpecialDuty: (id: string, status: DutyStatus, completion_notes?: string): DailySpecialDuty | null => {
    const idx = dailySpecialDuties.findIndex(d => d.id === id)
    if (idx === -1) return null
    dailySpecialDuties[idx] = {
      ...dailySpecialDuties[idx],
      status,
      completion_notes: completion_notes ?? dailySpecialDuties[idx].completion_notes,
    }
    saveLocal('daily_special_duties', dailySpecialDuties)
    return dailySpecialDuties[idx]
  },

  // ---- CLASS ACTIVITIES & ASSESSMENTS ----
  getClassActivities: (institutionId?: string, classId?: string): ClassActivity[] => {
    let list = institutionId ? classActivities.filter(a => a.institution_id === institutionId) : classActivities
    if (classId) {
      list = list.filter(a => a.class_id === classId)
    }
    return list
  },
  updateClassActivityAssessment: (
    id: string,
    assessment_status: ActivityAssessmentStatus,
    assessment_notes?: string,
    assessed_by: string = 'Dr. Joseph Muwanga'
  ): ClassActivity | null => {
    const idx = classActivities.findIndex(a => a.id === id)
    if (idx === -1) return null
    classActivities[idx] = {
      ...classActivities[idx],
      assessment_status,
      assessment_notes: assessment_notes ?? classActivities[idx].assessment_notes,
      assessed_by,
      assessed_at: new Date().toISOString(),
    }
    saveLocal('class_activities', classActivities)
    return classActivities[idx]
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

    const invIdx = invoices.findIndex(i => i.id === data.invoice_id)
    if (invIdx !== -1) {
      const inv = invoices[invIdx]
      const total_paid = inv.total_paid + data.amount
      const balance = Math.max(0, inv.total_amount - total_paid)
      const status = balance === 0 ? 'paid' : total_paid > 0 ? 'partial' : 'outstanding'
      invoices[invIdx] = { ...inv, total_paid, balance, status }
      saveLocal('invoices', invoices)
    }

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

  // ---- END-OF-DAY EXECUTIVE REPORT GENERATOR ----
  generateExecutiveDailyReport: (institutionId?: string) => {
    const stats = DataService.getStats(institutionId)
    const breakdowns = DataService.getClassAttendanceBreakdown(institutionId)
    const tods = DataService.getTeachersOnDuty(institutionId)
    const duties = DataService.getDailySpecialDuties(institutionId)
    const activities = DataService.getClassActivities(institutionId)

    const totalPresent = breakdowns.reduce((acc, b) => acc + b.present_count, 0)
    const totalLate = breakdowns.reduce((acc, b) => acc + b.late_count, 0)
    const totalAbsent = breakdowns.reduce((acc, b) => acc + b.absent_count, 0)
    const schoolAttendanceRate = stats.totalStudents > 0 ? Math.round(((totalPresent + totalLate) / stats.totalStudents) * 100) : 100

    const completedActivities = activities.filter(a => a.assessment_status === 'completed')
    const inProgressActivities = activities.filter(a => a.assessment_status === 'in_progress')
    const missedActivities = activities.filter(a => a.assessment_status === 'missed' || a.assessment_status === 'deferred')
    const scheduledActivities = activities.filter(a => a.assessment_status === 'scheduled')

    const completedDuties = duties.filter(d => d.status === 'completed')
    const pendingDuties = duties.filter(d => d.status === 'pending' || d.status === 'in_progress')

    const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    // Speech text for browser Web Speech synthesis
    const speechText = `Good evening. Here is the daily executive operational briefing for ZentraOS on ${dateStr}. 
The school recorded a total enrollment of ${stats.totalStudents} students with an overall attendance rate of ${schoolAttendanceRate} percent. ${totalPresent} students were present, ${totalLate} arrived late, and ${totalAbsent} were absent. 
Regarding academic syllabus execution: out of ${activities.length} scheduled lessons and practicals today, ${completedActivities.length} were successfully conducted and assessed, ${inProgressActivities.length} are currently in progress, and ${missedActivities.length} require follow-up. 
In institutional operations: ${completedDuties.length} out of ${duties.length} special duties have been completed, led by Lead Teacher on Duty Mr. Emmanuel Okello. 
On the financial ledger: total collections stand at ${formatCurrency(stats.totalCollected)}, representing a ${stats.collectionRate} percent recovery rate. 
The recommended priority plan for tomorrow is: first, conduct attendance follow-up for absent candidates in Senior Four; second, finalize the Library Lower Secondary textbooks accession; and third, conclude the Senior Three Physics spring constant lab evaluations. Have a pleasant evening.`

    return {
      date: dateStr,
      schoolAttendanceRate,
      totalStudents: stats.totalStudents,
      totalPresent,
      totalLate,
      totalAbsent,
      completedActivities,
      inProgressActivities,
      missedActivities,
      scheduledActivities,
      completedDuties,
      pendingDuties,
      tods,
      stats,
      speechText,
      tomorrowPlan: [
        'Follow up with parents of the absent students in Senior Four and Senior One.',
        'Review Senior Three Physics laboratory force-extension graph submissions with Mr. Okello.',
        'Supervise the delivery and cataloging of newly arrived Lower Secondary curriculum textbooks in the library.',
        'Follow up on outstanding Term 1 fee installments for Senior Two students before mid-term exams.',
        'Handover Teacher on Duty (TOD) logbook to the next duty shift teacher.',
      ],
    }
  },
}
