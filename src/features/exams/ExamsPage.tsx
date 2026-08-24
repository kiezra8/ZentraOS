import { useState, useMemo } from 'react'
import {
  FileText, Plus, Award, CheckCircle2, Search, Filter,
  Save, Printer, Download, Eye, Calculator, Sparkles, MessageSquare,
  Share2, Check, Copy, UserCheck, Calendar, DollarSign, Building2,
  ExternalLink
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { calculateGrade, formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { Exam, ExamType, StudentMark, GradingSystem, Student, StudentReportCard } from '@/types'

export function ExamsPage() {
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()

  const [activeTab, setActiveTab] = useState<'marks' | 'reports'>('reports')

  const [exams, setExams] = useState(() => DataService.getExams(institution?.id))
  const [classes] = useState(() => DataService.getClasses(institution?.id))
  const [subjects] = useState(() => DataService.getSubjects(institution?.id))
  const [gradingSystems] = useState(() => DataService.getGradingSystems(institution?.id))
  const defaultGrading = gradingSystems[0]

  // Marks Entry Tab state
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '')
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0]

  // Report Cards Tab state
  const [selectedReportClassId, setSelectedReportClassId] = useState(classes[0]?.id || '')
  const [reportSearch, setReportSearch] = useState('')

  // Students in selected exam's class
  const classStudents = useMemo(() => {
    if (!activeExam) return []
    return DataService.getStudents(institution?.id).filter(s => s.current_class_id === activeExam.class_id)
  }, [activeExam, institution?.id])

  // Students in selected report class
  const reportClassStudents = useMemo(() => {
    const list = DataService.getStudents(institution?.id).filter(
      s => !selectedReportClassId || s.current_class_id === selectedReportClassId
    )
    if (!reportSearch) return list
    return list.filter(s =>
      `${s.first_name} ${s.last_name} ${s.admission_number}`
        .toLowerCase()
        .includes(reportSearch.toLowerCase())
    )
  }, [selectedReportClassId, reportSearch, institution?.id])

  // Marks state
  const [marksMap, setMarksMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    const existing = DataService.getMarksByExam(exams[0]?.id || '')
    existing.forEach(m => { map[m.student_id] = m.marks_obtained })
    return map
  })
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({})

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false)
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [activeReportCard, setActiveReportCard] = useState<StudentReportCard | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // New Exam Form states
  const [examName, setExamName] = useState('')
  const [examType, setExamType] = useState<ExamType>('midterm')
  const [examClassId, setExamClassId] = useState(classes[0]?.id || '')
  const [examSubjectId, setExamSubjectId] = useState(subjects[0]?.id || '')
  const [maxMarks, setMaxMarks] = useState('100')
  const [passMarks, setPassMarks] = useState('50')
  const [weight, setWeight] = useState('30')

  function handleSelectExam(id: string) {
    setSelectedExamId(id)
    const existing = DataService.getMarksByExam(id)
    const map: Record<string, number> = {}
    const remMap: Record<string, string> = {}
    existing.forEach(m => {
      map[m.student_id] = m.marks_obtained
      if (m.remarks) remMap[m.student_id] = m.remarks
    })
    setMarksMap(map)
    setRemarksMap(remMap)
  }

  function handleScoreChange(studentId: string, val: string) {
    const num = Math.max(0, Math.min(Number(activeExam?.max_marks || 100), parseFloat(val) || 0))
    setMarksMap(prev => ({ ...prev, [studentId]: num }))
  }

  async function handleSaveMarks() {
    if (!activeExam) return
    setIsSaving(true)
    try {
      const marksList = classStudents.map(s => {
        const score = marksMap[s.id] ?? 0
        const grade = calculateGrade(score, activeExam.max_marks, defaultGrading.scales)
        return {
          student_id: s.id,
          marks_obtained: score,
          grade,
          remarks: remarksMap[s.id] || (score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 50 ? 'Fair' : 'Needs improvement'),
        }
      })

      await DataService.saveMarks(activeExam.id, marksList)
      toast.success('Marks and grades saved successfully!')
    } catch {
      toast.error('Failed to save marks')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCreateExam(e: React.FormEvent) {
    e.preventDefault()
    if (!examName) return

    const newExam = DataService.createExam({
      institution_id: institution?.id || 'inst-001',
      name: examName,
      exam_type: examType,
      class_id: examClassId,
      subject_id: examSubjectId,
      academic_year_id: currentAcademicYear?.id || 'ay-2026',
      term_id: currentTerm?.id || 'term-1-2026',
      max_marks: parseFloat(maxMarks) || 100,
      pass_marks: parseFloat(passMarks) || 50,
      weight_percentage: parseFloat(weight) || 30,
    })

    setExams(DataService.getExams(institution?.id))
    setIsCreateOpen(false)
    setSelectedExamId(newExam.id)
    setExamName('')
    toast.success('Assessment created successfully!')
  }

  function handleOpenReportCard(studentId: string) {
    const card = DataService.generateStudentReportCard(studentId, currentTerm?.id)
    if (card) {
      setActiveReportCard(card)
      setIsReportCardModalOpen(true)
    } else {
      toast.error('Could not generate report card')
    }
  }

  function handleOpenWhatsAppModal(studentId: string) {
    const card = DataService.generateStudentReportCard(studentId, currentTerm?.id)
    if (card) {
      setActiveReportCard(card)
      setIsWhatsAppModalOpen(true)
    } else {
      toast.error('Could not prepare WhatsApp report')
    }
  }

  function handleSendWhatsAppDirect(reportCard: StudentReportCard) {
    const phone = reportCard.parent_info?.phone || reportCard.student.phone || '+256772400111'
    const message = DataService.generateWhatsAppReportText(reportCard)
    const url = DataService.getWhatsAppShareUrl(phone, message)
    window.open(url, '_blank')
    toast.success(`Opening WhatsApp for ${reportCard.parent_info?.name || 'Parent'}...`)
  }

  function handleCopyWhatsAppText(reportCard: StudentReportCard) {
    const message = DataService.generateWhatsAppReportText(reportCard)
    navigator.clipboard.writeText(message)
    toast.success('WhatsApp report text copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Examinations & Student Report Cards"
        subtitle="Manage continuous assessments, enter term marks, generate official report cards, and dispatch instant reports to parents via WhatsApp"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'marks' && (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create Assessment
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveMarks}
                  isLoading={isSaving}
                >
                  Save Marks Sheet
                </Button>
              </>
            )}
            {activeTab === 'reports' && (
              <Button
                variant="primary"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Batch Reports
              </Button>
            )}
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Official Report Cards & WhatsApp Dispatch</span>
        </button>
        <button
          onClick={() => setActiveTab('marks')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'marks'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Marks Entry & Assessment Score Sheet</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL REPORT CARDS & WHATSAPP DISPATCH */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Filter by Class Level</label>
                <Select
                  options={[
                    { value: '', label: 'All Classes (School-Wide)' },
                    ...classes.map(c => ({ value: c.id, label: c.name })),
                  ]}
                  value={selectedReportClassId}
                  onChange={e => setSelectedReportClassId(e.target.value)}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="label text-xs">Search Student or Admission ID</label>
                <Input
                  placeholder="Search by student name or admission number..."
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  leftAdornment={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Student Report Cards Roster</h3>
                <p className="text-xs text-surface-500">
                  Showing {reportClassStudents.length} students with connected parents & WhatsApp dispatch
                </p>
              </div>
              <Badge variant="success" dot>Auto-Linked to Parents</Badge>
            </div>

            <div className="table-container bg-white">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Class & Stream</th>
                    <th>Connected Parent / Guardian</th>
                    <th>Academic Standing</th>
                    <th>Fees Ledger</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportClassStudents.map(student => {
                    const card = DataService.generateStudentReportCard(student.id, currentTerm?.id)
                    const parent = student.parent
                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="font-bold text-surface-900 text-sm">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="font-mono text-xs text-surface-400">
                            {student.admission_number}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-surface-800 text-xs">
                            {student.current_class?.name || 'Class'}
                          </div>
                          <div className="text-[11px] text-surface-400">
                            {student.current_stream?.name || 'Stream A'}
                          </div>
                        </td>
                        <td>
                          {parent ? (
                            <div>
                              <div className="font-semibold text-surface-900 text-xs flex items-center gap-1">
                                <span>{parent.full_name}</span>
                                <Badge variant="surface" className="text-[9px] px-1 py-0">{student.parents?.[0]?.relationship || 'Parent'}</Badge>
                              </div>
                              <div className="text-[11px] text-primary-700 font-mono">
                                {parent.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-surface-400 italic">No parent linked</span>
                          )}
                        </td>
                        <td>
                          {card && (
                            <div>
                              <div className="font-bold text-xs text-emerald-700">
                                {card.average_score}% • {card.division.split(' ')[0]}
                              </div>
                              <div className="text-[11px] text-surface-500">
                                Rank: {card.class_rank}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          {card && (
                            <div>
                              <div className={`font-bold text-xs ${card.fees_summary.balance_due === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {card.fees_summary.balance_due === 0 ? 'Cleared (0 Bal)' : formatCurrency(card.fees_summary.balance_due)}
                              </div>
                              <div className="text-[10px] text-surface-400">
                                Paid: {formatCurrency(card.fees_summary.total_paid)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenReportCard(student.id)}
                            >
                              View & Print
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenWhatsAppModal(student.id)}
                            >
                              WhatsApp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKS ENTRY & ASSESSMENT SCORE SHEET */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 max-w-md">
                <label className="label text-xs">Select Assessment / Exam</label>
                <Select
                  options={exams.map(e => ({
                    value: e.id,
                    label: `${e.name} (${e.class?.name || 'Class'})`,
                  }))}
                  value={selectedExamId}
                  onChange={e => handleSelectExam(e.target.value)}
                />
              </div>

              {activeExam && (
                <div className="flex items-center gap-3 pt-2 sm:pt-4 text-xs text-surface-600">
                  <div>Class: <span className="font-semibold text-surface-900">{activeExam.class?.name}</span></div>
                  <div>•</div>
                  <div>Subject: <span className="font-semibold text-surface-900">{activeExam.subject?.name}</span></div>
                  <div>•</div>
                  <div>Max: <span className="font-semibold text-primary-700">{activeExam.max_marks} marks</span></div>
                </div>
              )}
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-surface-900">Student Score Sheet</h2>
                <p className="text-xs text-surface-500">Enter marks obtained (0 to {activeExam?.max_marks || 100})</p>
              </div>
              <Badge variant="primary">Grading System: UNEB O-Level</Badge>
            </div>

            <div className="table-container bg-white">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No</th>
                    <th className="w-32">Marks ({activeExam?.max_marks || 100})</th>
                    <th>Grade</th>
                    <th>Teacher Remarks</th>
                    <th className="text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(student => {
                    const score = marksMap[student.id] ?? 0
                    const grade = calculateGrade(score, activeExam?.max_marks || 100, defaultGrading.scales)
                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="font-semibold text-surface-900">
                            {student.first_name} {student.last_name}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-surface-500">
                          {student.admission_number}
                        </td>
                        <td>
                          <Input
                            type="number"
                            min="0"
                            max={activeExam?.max_marks || 100}
                            value={marksMap[student.id] ?? ''}
                            onChange={e => handleScoreChange(student.id, e.target.value)}
                            placeholder="0"
                            className="py-1 px-2.5 h-9 font-bold text-center text-sm"
                          />
                        </td>
                        <td>
                          <Badge
                            variant={score >= 70 ? 'success' : score >= 50 ? 'primary' : 'danger'}
                            className="font-bold text-xs"
                          >
                            {grade}
                          </Badge>
                        </td>
                        <td>
                          <Input
                            value={remarksMap[student.id] ?? ''}
                            onChange={e => setRemarksMap(prev => ({ ...prev, [student.id]: e.target.value }))}
                            placeholder="Teacher observation..."
                            className="py-1 px-2.5 h-9 text-xs"
                          />
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Award className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenReportCard(student.id)}
                          >
                            Report Card
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Assessment"
        description="Schedule a test, midterm, or final examination"
      >
        <form onSubmit={handleCreateExam} className="space-y-3">
          <div>
            <label className="label">Assessment Title *</label>
            <Input
              required
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder="e.g. Term 1 End of Term Examination"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Class Level *</label>
              <Select
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={examClassId}
                onChange={e => setExamClassId(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Subject *</label>
              <Select
                options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || 'Sub'})` }))}
                value={examSubjectId}
                onChange={e => setExamSubjectId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <Select
                options={[
                  { value: 'cat', label: 'Continuous Test (CAT)' },
                  { value: 'midterm', label: 'Mid-Term Exam' },
                  { value: 'endterm', label: 'End of Term Exam' },
                  { value: 'practical', label: 'Practical Exam' },
                ]}
                value={examType}
                onChange={e => setExamType(e.target.value as any)}
              />
            </div>
            <div>
              <label className="label">Max Marks</label>
              <Input
                type="number"
                value={maxMarks}
                onChange={e => setMaxMarks(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Pass Mark</label>
              <Input
                type="number"
                value={passMarks}
                onChange={e => setPassMarks(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Assessment
            </Button>
          </div>
        </form>
      </Modal>

      {/* FULL OFFICIAL REPORT CARD PRINT MODAL */}
      <Modal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
        title="Official Student Academic Report Card"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="success"
              size="sm"
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => {
                if (activeReportCard) handleSendWhatsAppDirect(activeReportCard)
              }}
            >
              Send to Parent via WhatsApp
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Official Report Card
            </Button>
          </div>
        }
      >
        {activeReportCard && (
          <div className="space-y-4 p-6 border-2 border-surface-300 rounded-3xl bg-white text-surface-900 shadow-sm print:p-0 print:border-none print:shadow-none">
            {/* School Crest & Header */}
            <div className="text-center border-b-2 border-surface-800 pb-3 space-y-0.5">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary-700 text-white flex items-center justify-center font-black text-lg">
                  KM
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-surface-950 uppercase">
                    {institution?.name || 'KAMPALA MODEL HIGH SCHOOL'}
                  </h1>
                  <p className="text-[11px] text-surface-500 font-semibold uppercase tracking-wider">
                    "EXCELLENCE IN LEADERSHIP & INTEGRITY"
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-surface-600">
                P.O. Box 7122, Kampala, Uganda • Tel: +256 772 112233 • UNEB Center No: U0894
              </p>
              <div className="inline-block px-3 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-bold mt-1">
                OFFICIAL TERMINAL ACADEMIC REPORT — {activeReportCard.term.name.toUpperCase()} ({activeReportCard.academic_year.name})
              </div>
            </div>

            {/* Student & Guardian Bio Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-surface-50 rounded-2xl border border-surface-200">
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-extrabold text-surface-900 text-sm">
                  {activeReportCard.student.first_name} {activeReportCard.student.last_name}
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Admission ID</span>
                <span className="font-mono font-bold text-primary-700">
                  {activeReportCard.student.admission_number}
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Class & Stream</span>
                <span className="font-bold text-surface-900">
                  {activeReportCard.class_name} ({activeReportCard.stream_name})
                </span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Parent / Guardian</span>
                <span className="font-bold text-surface-900">
                  {activeReportCard.parent_info?.name || 'Patrick Kigozi'} ({activeReportCard.parent_info?.phone || '+256 772 400111'})
                </span>
              </div>
            </div>

            {/* Subject Assessment Table */}
            <div className="border border-surface-300 rounded-2xl overflow-hidden">
              <table className="table text-xs">
                <thead className="bg-surface-100 text-surface-800">
                  <tr>
                    <th>Subject</th>
                    <th className="text-center">Mid (30%)</th>
                    <th className="text-center">End (70%)</th>
                    <th className="text-center">Total (100%)</th>
                    <th className="text-center">Grade</th>
                    <th className="text-center">Points</th>
                    <th>Teacher Remarks</th>
                    <th className="text-center">Initials</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReportCard.subjects.map(sub => (
                    <tr key={sub.subject_id} className="border-b border-surface-100">
                      <td className="font-bold text-surface-900">{sub.subject_name}</td>
                      <td className="text-center font-medium">{sub.midterm_score}</td>
                      <td className="text-center font-medium">{sub.endterm_score}</td>
                      <td className="text-center font-bold text-surface-900">{sub.final_score}%</td>
                      <td className="text-center">
                        <span className="font-extrabold text-primary-700 px-2 py-0.5 rounded bg-primary-50">
                          {sub.grade.split(' ')[0]}
                        </span>
                      </td>
                      <td className="text-center font-semibold">{sub.points}</td>
                      <td className="text-surface-600 italic text-[11px]">{sub.remarks}</td>
                      <td className="text-center font-mono text-[11px]">{sub.teacher_initials}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Performance Summary Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-primary-50 rounded-2xl border border-primary-200 text-center">
                <span className="text-primary-600 block font-semibold text-[10px] uppercase">Total Marks</span>
                <span className="font-black text-primary-800 text-base">{activeReportCard.total_marks} / {activeReportCard.subjects.length * 100}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-emerald-700 block font-semibold text-[10px] uppercase">Average Score</span>
                <span className="font-black text-emerald-800 text-base">{activeReportCard.average_score}%</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center">
                <span className="text-indigo-700 block font-semibold text-[10px] uppercase">Overall Division</span>
                <span className="font-black text-indigo-900 text-sm">{activeReportCard.division}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                <span className="text-amber-800 block font-semibold text-[10px] uppercase">Class Position</span>
                <span className="font-black text-amber-900 text-sm">{activeReportCard.class_rank}</span>
              </div>
            </div>

            {/* Attendance & Fees Ledger Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-50 rounded-2xl border border-surface-200 space-y-1">
                <div className="font-bold text-surface-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Attendance & Conduct Record</span>
                </div>
                <div className="text-surface-600">
                  Turnout: <strong>{activeReportCard.attendance_summary.attendance_rate}%</strong> ({activeReportCard.attendance_summary.days_present} days present out of {activeReportCard.attendance_summary.days_total})
                </div>
                <div className="text-surface-600">
                  Conduct Rating: <strong className="text-emerald-700">{activeReportCard.conduct_rating}</strong>
                </div>
              </div>

              <div className="p-3 bg-surface-50 rounded-2xl border border-surface-200 space-y-1">
                <div className="font-bold text-surface-900 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                  <span>School Fees Account Ledger</span>
                </div>
                <div className="text-surface-600 flex items-center justify-between">
                  <span>Paid this term: <strong>{formatCurrency(activeReportCard.fees_summary.total_paid)}</strong></span>
                  <span className={`font-bold ${activeReportCard.fees_summary.balance_due === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {activeReportCard.fees_summary.balance_due === 0 ? '✓ Cleared' : `Bal: ${formatCurrency(activeReportCard.fees_summary.balance_due)}`}
                  </span>
                </div>
                <div className="text-surface-600">
                  Next Term Fees Due: <strong>{formatCurrency(activeReportCard.next_term_fees)}</strong>
                </div>
              </div>
            </div>

            {/* Remarks & Signatures */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-surface-50 rounded-2xl border border-surface-200">
                <span className="font-bold text-surface-900 block mb-0.5">Class Teacher's Remarks:</span>
                <p className="text-surface-700 italic">"{activeReportCard.class_teacher_remarks}"</p>
                <div className="mt-2 text-[11px] text-surface-500 font-semibold text-right">Class Master Signature: _______________________</div>
              </div>

              <div className="p-3 bg-surface-50 rounded-2xl border border-surface-200">
                <span className="font-bold text-surface-900 block mb-0.5">Head Teacher's Remarks & Official Seal:</span>
                <p className="text-surface-700 italic">"{activeReportCard.head_teacher_remarks}"</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-surface-500 font-semibold pt-2 border-t border-surface-200">
                  <span>Next Term Resumption: <strong>{formatDate(activeReportCard.next_term_start_date)}</strong></span>
                  <span>Head Teacher Stamp: _______________________</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* WHATSAPP REPORT DISPATCHER MODAL */}
      <Modal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        title="Send Report Card to Parent via WhatsApp"
        description="Directly dispatch full formatted report text & child analytics to the parent's phone"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => {
                if (activeReportCard) handleCopyWhatsAppText(activeReportCard)
              }}
            >
              Copy Text
            </Button>
            <Button
              variant="success"
              size="sm"
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => {
                if (activeReportCard) handleSendWhatsAppDirect(activeReportCard)
              }}
            >
              Open WhatsApp Chat
            </Button>
          </div>
        }
      >
        {activeReportCard && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-900 text-sm">
                  {activeReportCard.parent_info?.name || 'Patrick Kigozi'}
                </div>
                <div className="text-emerald-700">
                  Parent of {activeReportCard.student.first_name} ({activeReportCard.class_name})
                </div>
              </div>
              <Badge variant="success" className="font-mono text-xs">
                {activeReportCard.parent_info?.phone || '+256 772 400111'}
              </Badge>
            </div>

            <div>
              <label className="label text-xs font-bold text-surface-800">
                Formatted WhatsApp Message Preview:
              </label>
              <pre className="p-3 bg-surface-900 text-surface-100 rounded-2xl font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto border border-surface-800">
                {DataService.generateWhatsAppReportText(activeReportCard)}
              </pre>
            </div>

            <div className="text-[11px] text-surface-500 bg-surface-100 p-2.5 rounded-xl">
              💡 Clicking <strong>"Open WhatsApp Chat"</strong> will launch WhatsApp Web or Mobile with this exact report message pre-filled. You can also attach the printed PDF report card directly in the conversation.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
