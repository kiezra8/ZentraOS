import { useState, useMemo } from 'react'
import {
  FileText, Plus, Award, CheckCircle2, Search, Filter,
  Save, Printer, Download, Eye, Calculator, Sparkles
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { calculateGrade, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { Exam, ExamType, StudentMark, GradingSystem } from '@/types'

export function ExamsPage() {
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()

  const [exams, setExams] = useState(() => DataService.getExams(institution?.id))
  const [classes] = useState(() => DataService.getClasses(institution?.id))
  const [subjects] = useState(() => DataService.getSubjects(institution?.id))
  const [gradingSystems] = useState(() => DataService.getGradingSystems(institution?.id))
  const defaultGrading = gradingSystems[0]

  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '')
  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0]

  // Students in current exam's class
  const classStudents = useMemo(() => {
    if (!activeExam) return []
    return DataService.getStudents(institution?.id).filter(s => s.current_class_id === activeExam.class_id)
  }, [activeExam, institution?.id])

  // Marks state: { studentId: score }
  const [marksMap, setMarksMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    const existing = DataService.getMarksByExam(exams[0]?.id || '')
    existing.forEach(m => { map[m.student_id] = m.marks_obtained })
    return map
  })

  // Remarks state
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({})

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // New Exam Form states
  const [examName, setExamName] = useState('')
  const [examType, setExamType] = useState<ExamType>('midterm')
  const [examClassId, setExamClassId] = useState(classes[0]?.id || '')
  const [examSubjectId, setExamSubjectId] = useState(subjects[0]?.id || '')
  const [maxMarks, setMaxMarks] = useState('100')
  const [passMarks, setPassMarks] = useState('50')
  const [weight, setWeight] = useState('30')

  // When switching exam
  function handleSelectExam(id: string) {
    setSelectedExamId(id)
    const existing = DataService.getMarksByExam(id)
    const newMap: Record<string, number> = {}
    existing.forEach(m => { newMap[m.student_id] = m.marks_obtained })
    setMarksMap(newMap)
  }

  function handleScoreChange(studentId: string, value: string) {
    const num = Math.min(100, Math.max(0, parseFloat(value) || 0))
    setMarksMap(prev => ({
      ...prev,
      [studentId]: num,
    }))
  }

  async function handleSaveMarks() {
    if (!activeExam) return
    setIsSaving(true)

    const list = classStudents.map(s => {
      const score = marksMap[s.id] ?? 0
      const grade = calculateGrade(score, activeExam.max_marks, defaultGrading.scales)
      return {
        student_id: s.id,
        marks_obtained: score,
        grade,
        remarks: remarksMap[s.id] || (score >= 80 ? 'Excellent work' : score >= 60 ? 'Satisfactory' : 'Needs revision'),
      }
    })

    await DataService.saveMarks(activeExam.id, list)
    setIsSaving(false)
    toast.success('Assessment marks published and saved!')
  }

  function handleCreateExam(e: React.FormEvent) {
    e.preventDefault()
    const newExam = DataService.createExam({
      institution_id: institution?.id || 'inst-001',
      name: examName,
      exam_type: examType,
      class_id: examClassId,
      subject_id: examSubjectId,
      term_id: currentTerm?.id || 'term-1-2026',
      academic_year_id: currentAcademicYear?.id || 'ay-2026',
      max_marks: parseFloat(maxMarks) || 100,
      pass_marks: parseFloat(passMarks) || 50,
      weight_percentage: parseFloat(weight) || 30,
      date: new Date().toISOString().split('T')[0],
    })

    setExams(DataService.getExams(institution?.id))
    setSelectedExamId(newExam.id)
    setIsCreateOpen(false)
    setExamName('')
    toast.success('New examination scheduled successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Examinations & Results"
        subtitle="Manage continuous assessments, term examinations, and automated UNEB grade calculations"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Examination
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSaveMarks}
            >
              Publish Marks
            </Button>
          </div>
        }
      />

      {/* Exam Selector Bar */}
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

      {/* Marks Entry Table */}
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
                <th>Remarks</th>
                <th className="text-right">Report</th>
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
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedStudentForReport({
                            student,
                            score,
                            grade,
                            exam: activeExam,
                          })
                          setIsReportOpen(true)
                        }}
                      >
                        Slip
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXAM MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Examination"
        description="Create a new continuous assessment test or end of term exam"
      >
        <form onSubmit={handleCreateExam} className="space-y-3">
          <div>
            <label className="label">Exam / Assessment Name *</label>
            <Input
              required
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder="e.g. Term 1 End-of-Term Mathematics Examination"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Exam Category</label>
              <Select
                options={[
                  { value: 'cat', label: 'Continuous Assessment (CAT)' },
                  { value: 'midterm', label: 'Mid-Term Exam' },
                  { value: 'endterm', label: 'End-of-Term Exam' },
                  { value: 'practical', label: 'Practical Lab Exam' },
                  { value: 'clinical', label: 'Clinical Rotation Assessment' },
                ]}
                value={examType}
                onChange={e => setExamType(e.target.value as ExamType)}
              />
            </div>
            <div>
              <label className="label">Target Class *</label>
              <Select
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={examClassId}
                onChange={e => setExamClassId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Subject</label>
              <Select
                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                value={examSubjectId}
                onChange={e => setExamSubjectId(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Max Marks</label>
              <Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
            </div>
            <div>
              <label className="label">Pass Mark</label>
              <Input type="number" value={passMarks} onChange={e => setPassMarks(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Exam
            </Button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE REPORT SLIP MODAL */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Official Student Result Slip"
        size="md"
        footer={
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print Official Slip
          </Button>
        }
      >
        {selectedStudentForReport && (
          <div className="space-y-4 p-4 border border-surface-200 rounded-2xl bg-surface-50/50">
            <div className="text-center border-b border-surface-200 pb-3">
              <h2 className="text-base font-extrabold text-surface-900 uppercase tracking-tight">
                {institution?.name}
              </h2>
              <p className="text-[11px] text-surface-500">{institution?.address} • {institution?.phone}</p>
              <p className="text-xs font-bold text-primary-700 mt-1 uppercase tracking-wider">
                {currentAcademicYear?.name} • {currentTerm?.name} Academic Assessment Slip
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-surface-400">Student Name: </span>
                <span className="font-bold text-surface-800">
                  {selectedStudentForReport.student.first_name} {selectedStudentForReport.student.last_name}
                </span>
              </div>
              <div>
                <span className="text-surface-400">Admission No: </span>
                <span className="font-mono font-bold text-surface-800">{selectedStudentForReport.student.admission_number}</span>
              </div>
              <div>
                <span className="text-surface-400">Class: </span>
                <span className="font-bold text-surface-800">{selectedStudentForReport.exam.class?.name}</span>
              </div>
              <div>
                <span className="text-surface-400">Subject: </span>
                <span className="font-bold text-surface-800">{selectedStudentForReport.exam.subject?.name}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-surface-200 text-center space-y-1">
              <div className="text-xs text-surface-500 uppercase font-semibold">Marks Obtained</div>
              <div className="text-3xl font-extrabold text-primary-700">
                {selectedStudentForReport.score} / {selectedStudentForReport.exam.max_marks}
              </div>
              <Badge variant="success" className="text-xs font-bold px-3 py-1 mt-1">
                Grade: {selectedStudentForReport.grade}
              </Badge>
            </div>

            <div className="text-xs text-surface-600 border-t border-surface-200 pt-3">
              <span className="font-bold">Head Teacher's Stamp & Signature: </span>
              <div className="h-10 mt-1 border-b border-dashed border-surface-300" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
