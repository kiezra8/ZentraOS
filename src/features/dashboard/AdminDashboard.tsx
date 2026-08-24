import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, GraduationCap, DollarSign, Calendar, TrendingUp, AlertCircle,
  Clock, CheckCircle2, ChevronRight, UserCheck, Shield, BookOpen,
  Volume2, VolumeX, Play, Pause, Square, Sparkles, CheckSquare,
  ArrowUpRight, Phone, MapPin, Eye, Check, X, ClipboardCheck,
  AlertTriangle, RefreshCw, Radio, Layers
} from 'lucide-react'
import { StatCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select, Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService, ClassAttendanceSummary } from '@/lib/dataService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { TeacherOnDuty, DailySpecialDuty, ClassActivity, ActivityAssessmentStatus, AttendanceStatus } from '@/types'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const { institution, currentTerm, currentAcademicYear } = useInstitutionStore()
  const navigate = useNavigate()

  // Live Data State
  const [stats, setStats] = useState(() => DataService.getStats(institution?.id))
  const [classBreakdowns, setClassBreakdowns] = useState<ClassAttendanceSummary[]>(() => DataService.getClassAttendanceBreakdown(institution?.id))
  const [teachersOnDuty, setTeachersOnDuty] = useState<TeacherOnDuty[]>(() => DataService.getTeachersOnDuty(institution?.id))
  const [specialDuties, setSpecialDuties] = useState<DailySpecialDuty[]>(() => DataService.getDailySpecialDuties(institution?.id))
  const [activities, setActivities] = useState<ClassActivity[]>(() => DataService.getClassActivities(institution?.id))

  // Class Attendance Modal (Drilldown)
  const [selectedClassSummary, setSelectedClassSummary] = useState<ClassAttendanceSummary | null>(null)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)

  // Activity Assessment Modal
  const [selectedActivity, setSelectedActivity] = useState<ClassActivity | null>(null)
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false)
  const [assessmentStatus, setAssessmentStatus] = useState<ActivityAssessmentStatus>('completed')
  const [assessmentNotes, setAssessmentNotes] = useState('')

  // Duty Update Modal
  const [selectedDuty, setSelectedDuty] = useState<DailySpecialDuty | null>(null)
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false)
  const [dutyStatus, setDutyStatus] = useState<'completed' | 'in_progress' | 'pending'>('completed')
  const [dutyNotes, setDutyNotes] = useState('')

  // End of Day Executive Report State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isAudioPaused, setIsAudioPaused] = useState(false)

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  function refreshAllData() {
    setStats(DataService.getStats(institution?.id))
    setClassBreakdowns(DataService.getClassAttendanceBreakdown(institution?.id))
    setTeachersOnDuty(DataService.getTeachersOnDuty(institution?.id))
    setSpecialDuties(DataService.getDailySpecialDuties(institution?.id))
    setActivities(DataService.getClassActivities(institution?.id))
  }

  function handleOpenClassDetail(cls: ClassAttendanceSummary) {
    setSelectedClassSummary(cls)
    setIsClassModalOpen(true)
  }

  function handleToggleStudentStatus(studentId: string, currentStatus: AttendanceStatus) {
    if (!selectedClassSummary) return
    const nextStatus: AttendanceStatus = currentStatus === 'present' ? 'absent' : currentStatus === 'absent' ? 'late' : 'present'
    
    // Save to DataService
    DataService.saveAttendanceSession(
      {
        institution_id: institution?.id || 'inst-001',
        class_id: selectedClassSummary.class_id,
        date: new Date().toISOString().split('T')[0],
        period: 'Morning Roll Call',
        term_id: currentTerm?.id || 'term-1-2026',
        taken_by: user?.profile.full_name || 'Administrator',
      },
      [{ student_id: studentId, status: nextStatus }]
    )

    refreshAllData()
    // Update local modal state
    setSelectedClassSummary(prev => {
      if (!prev) return null
      const updatedStudents = prev.students.map(item =>
        item.student.id === studentId ? { ...item, status: nextStatus } : item
      )
      return { ...prev, students: updatedStudents }
    })
    toast.success('Attendance updated')
  }

  function handleSaveActivityAssessment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedActivity) return
    DataService.updateClassActivityAssessment(
      selectedActivity.id,
      assessmentStatus,
      assessmentNotes,
      user?.profile.full_name || 'Dr. Joseph Muwanga'
    )
    refreshAllData()
    setIsAssessModalOpen(false)
    toast.success('Activity assessment recorded successfully!')
  }

  function handleSaveDuty(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDuty) return
    DataService.updateDailySpecialDuty(selectedDuty.id, dutyStatus, dutyNotes)
    refreshAllData()
    setIsDutyModalOpen(false)
    toast.success('Duty assignment updated!')
  }

  const executiveReport = DataService.generateExecutiveDailyReport(institution?.id)

  function handlePlayVoiceReport() {
    if (!synthRef.current) {
      toast.error('Voice narration is not supported in this browser.')
      return
    }

    if (isAudioPaused) {
      synthRef.current.resume()
      setIsAudioPaused(false)
      setIsPlayingAudio(true)
      return
    }

    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(executiveReport.speechText)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.lang = 'en-GB'

    utterance.onend = () => {
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    }

    utterance.onerror = () => {
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
    setIsPlayingAudio(true)
    setIsAudioPaused(false)
  }

  function handlePauseVoiceReport() {
    if (synthRef.current && isPlayingAudio) {
      synthRef.current.pause()
      setIsAudioPaused(true)
      setIsPlayingAudio(false)
    }
  }

  function handleStopVoiceReport() {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    }
  }

  const totalPresentToday = classBreakdowns.reduce((acc, c) => acc + c.present_count, 0)
  const totalLateToday = classBreakdowns.reduce((acc, c) => acc + c.late_count, 0)
  const totalAbsentToday = classBreakdowns.reduce((acc, c) => acc + c.absent_count, 0)
  const overallAttendanceRate = stats.totalStudents > 0 ? Math.round(((totalPresentToday + totalLateToday) / stats.totalStudents) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Top Banner with End of Day AI Report CTA */}
      <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-surface-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-3 border border-primary-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Live School Digital Operating System • {currentAcademicYear?.name || '2026'} ({currentTerm?.name || 'Term 1'})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.profile.full_name ?? 'Head Teacher'}
          </h1>
          <p className="text-primary-200 text-xs sm:text-sm mt-1.5 leading-relaxed">
            School operations running at <span className="text-white font-bold">{overallAttendanceRate}%</span> attendance across all classes. Review student registers, teachers on duty, class activities, and generate the end-of-day voice briefing.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-lg"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
            onClick={() => setIsReportModalOpen(true)}
          >
            End-of-Day Voice & Text Report
          </Button>
          <Button
            variant="primary"
            leftIcon={<ClipboardCheck className="w-4 h-4" />}
            onClick={() => navigate('/attendance')}
          >
            Open Roll Call Register
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total School Enrollment"
          value={stats.totalStudents}
          subtitle="Registered Active Students"
          icon={<GraduationCap className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
          trend={{ value: 12, label: 'new admissions this term', positive: true }}
        />
        <StatCard
          title="Today's School Attendance"
          value={`${overallAttendanceRate}%`}
          subtitle={`${totalPresentToday} Present • ${totalLateToday} Late • ${totalAbsentToday} Absent`}
          icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={{ value: overallAttendanceRate, label: 'turnout today', positive: overallAttendanceRate >= 85 }}
        />
        <StatCard
          title="Teachers & Staff Active"
          value={stats.totalStaff}
          subtitle="Teaching & Support Staff"
          icon={<Users className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Fee Recovery Rate"
          value={`${stats.collectionRate}%`}
          subtitle={`Collected: ${formatCurrency(stats.totalCollected)}`}
          icon={<DollarSign className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* SECTION 1: ATTENDANCE OF STUDENTS BY CLASS (CLICKABLE TO VIEW SPECIFIC CLASS ATTENDANCE) */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-surface-900">Student Attendance by Class</h2>
              <Badge variant="primary" className="text-[10px]">Tap any class for student list</Badge>
            </div>
            <p className="text-xs text-surface-500">Live morning roll call breakdown and presence tracking per grade level</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={refreshAllData}
          >
            Refresh Counts
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {classBreakdowns.map((cls) => (
            <div
              key={cls.class_id}
              onClick={() => handleOpenClassDetail(cls)}
              className="p-4 rounded-2xl border border-surface-200 bg-surface-50/50 hover:bg-white hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="font-extrabold text-sm text-surface-900 group-hover:text-primary-600 transition-colors">
                    {cls.class_name}
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                
                <div className="text-[11px] text-surface-500 mt-0.5">
                  {cls.total_students} Students Enrolled
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cls.attendance_rate >= 90
                        ? 'bg-emerald-500'
                        : cls.attendance_rate >= 75
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${cls.attendance_rate}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-surface-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-surface-800">{cls.attendance_rate}%</span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-emerald-700 font-medium">{cls.present_count + cls.late_count} Present</span>
                  {cls.absent_count > 0 && (
                    <span className="text-red-600 font-bold">• {cls.absent_count} Absent</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: TEACHERS ON DUTY (TOD) & DAILY SPECIAL DUTIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers on Duty */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-600" />
                <span>Teachers on Duty (TOD)</span>
              </h3>
              <p className="text-xs text-surface-500">Supervising shifts, punctuality, meals & compound welfare today</p>
            </div>
            <Badge variant="success" dot>Active Shifts</Badge>
          </div>

          <div className="space-y-3">
            {teachersOnDuty.map(tod => (
              <div key={tod.id} className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-surface-900">{tod.teacher_name}</span>
                    <Badge variant={tod.is_active_now ? 'primary' : 'surface'} className="text-[10px]">
                      {tod.role_title}
                    </Badge>
                  </div>
                  <div className="text-xs text-surface-600 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-surface-400" />
                    <span>{tod.duty_area}</span>
                  </div>
                  <div className="text-[11px] text-surface-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-surface-400" />
                    <span>Shift: {tod.shift_time}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-200">
                  <a
                    href={`tel:${tod.contact_phone}`}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline bg-primary-50 px-2.5 py-1 rounded-lg"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{tod.contact_phone}</span>
                  </a>
                  {tod.notes && (
                    <span className="text-[10px] text-surface-500 italic max-w-[200px] text-right truncate">
                      {tod.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Special Duties & Responsibilities */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Daily Special Duties & Assignments</span>
              </h3>
              <p className="text-xs text-surface-500">Critical institutional workflows, laboratories & health audits</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedDuty(specialDuties[0])
                setDutyStatus(specialDuties[0]?.status || 'completed')
                setDutyNotes(specialDuties[0]?.completion_notes || '')
                setIsDutyModalOpen(true)
              }}
            >
              Update Status
            </Button>
          </div>

          <div className="space-y-3">
            {specialDuties.map(duty => (
              <div
                key={duty.id}
                onClick={() => {
                  setSelectedDuty(duty)
                  setDutyStatus(duty.status)
                  setDutyNotes(duty.completion_notes || '')
                  setIsDutyModalOpen(true)
                }}
                className="p-3.5 rounded-2xl border border-surface-200 hover:border-emerald-400 bg-white hover:shadow-sm transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-surface-900 leading-snug">
                    {duty.duty_title}
                  </div>
                  <Badge
                    variant={
                      duty.status === 'completed'
                        ? 'success'
                        : duty.status === 'in_progress'
                        ? 'primary'
                        : 'warning'
                    }
                    className="capitalize text-[10px] shrink-0"
                  >
                    {duty.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="text-xs text-surface-600">
                  <span className="font-semibold text-surface-800">Responsible:</span> {duty.responsible_person} ({duty.department})
                </div>

                <div className="text-[11px] text-surface-500 flex items-center justify-between pt-1 border-t border-surface-100">
                  <span>⏰ {duty.scheduled_time}</span>
                  {duty.completion_notes && (
                    <span className="text-emerald-700 font-medium truncate max-w-[220px]">
                      ✓ {duty.completion_notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: CLASS-BY-CLASS ACTIVITIES & ASSESSMENTS */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-600" />
              <span>Class Activities & Operational Syllabus Assessment</span>
            </h3>
            <p className="text-xs text-surface-500">Live lessons, science laboratory practicals, and verification of lesson delivery</p>
          </div>
          <Badge variant="primary" className="self-start sm:self-auto text-xs">
            {activities.filter(a => a.assessment_status === 'completed').length} / {activities.length} Conducted & Assessed
          </Badge>
        </div>

        <div className="divide-y divide-surface-100">
          {activities.map(act => (
            <div key={act.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-surface-100 text-surface-800 border border-surface-200">
                    {act.class_name}
                  </span>
                  <span className="font-bold text-sm text-surface-900">{act.subject_or_activity}</span>
                </div>
                <div className="text-xs text-surface-600">
                  <span className="font-semibold text-surface-800">Teacher:</span> {act.teacher_name} • <span className="font-semibold text-surface-800">Venue:</span> {act.venue} • <span>{act.time_slot}</span>
                </div>
                <div className="text-xs text-surface-500 italic">
                  Outcome: "{act.expected_outcome}"
                </div>
                {act.assessment_notes && (
                  <div className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block mt-1">
                    Assessment: {act.assessment_notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Badge
                  variant={
                    act.assessment_status === 'completed'
                      ? 'success'
                      : act.assessment_status === 'in_progress'
                      ? 'primary'
                      : act.assessment_status === 'missed'
                      ? 'danger'
                      : act.assessment_status === 'deferred'
                      ? 'warning'
                      : 'surface'
                  }
                  className="capitalize text-xs px-2.5 py-1"
                >
                  {act.assessment_status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedActivity(act)
                    setAssessmentStatus(act.assessment_status)
                    setAssessmentNotes(act.assessment_notes || '')
                    setIsAssessModalOpen(true)
                  }}
                >
                  Assess Activity
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: SPECIFIC CLASS ATTENDANCE & STUDENTS ROSTER (DRILLDOWN) */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={selectedClassSummary ? `${selectedClassSummary.class_name} — Detailed Attendance Register` : 'Class Attendance'}
        description="View every student's attendance record with one-tap status toggling"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsClassModalOpen(false)
                navigate(`/attendance?classId=${selectedClassSummary?.class_id}`)
              }}
            >
              Open Full Attendance Sheet
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsClassModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        {selectedClassSummary && (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-surface-100 text-xs">
              <div>
                <span className="text-surface-400 block">Total</span>
                <span className="font-bold text-surface-900 text-sm">{selectedClassSummary.total_students}</span>
              </div>
              <div>
                <span className="text-emerald-700 block">Present</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedClassSummary.present_count}</span>
              </div>
              <div>
                <span className="text-amber-700 block">Late</span>
                <span className="font-bold text-amber-700 text-sm">{selectedClassSummary.late_count}</span>
              </div>
              <div>
                <span className="text-red-700 block">Absent</span>
                <span className="font-bold text-red-700 text-sm">{selectedClassSummary.absent_count}</span>
              </div>
            </div>

            <div className="text-xs text-surface-500 font-medium">
              Click any student status badge to quickly toggle between Present, Absent, and Late:
            </div>

            {/* Students List */}
            <div className="divide-y divide-surface-100 max-h-[360px] overflow-y-auto pr-1">
              {selectedClassSummary.students.length === 0 ? (
                <div className="py-8 text-center text-surface-400 text-xs">
                  No students currently assigned to this class level.
                </div>
              ) : (
                selectedClassSummary.students.map(({ student, status, notes }) => (
                  <div key={student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-surface-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-[11px] text-surface-400 font-mono">
                        {student.admission_number} • {student.gender} • Emergency: {student.emergency_contact_phone || '—'}
                      </div>
                      {notes && (
                        <div className="text-[11px] text-amber-700 italic mt-0.5">{notes}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStudentStatus(student.id, status)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        status === 'present'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : status === 'late'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {status.toUpperCase()} ↺
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: ASSESS CLASS ACTIVITY */}
      <Modal
        isOpen={isAssessModalOpen}
        onClose={() => setIsAssessModalOpen(false)}
        title="Assess Activity & Syllabus Delivery"
        description="Verify whether the lesson/activity took place and document teacher remarks"
      >
        {selectedActivity && (
          <form onSubmit={handleSaveActivityAssessment} className="space-y-4">
            <div className="p-3 bg-surface-50 rounded-xl space-y-1 text-xs border border-surface-200">
              <div className="font-bold text-surface-900">{selectedActivity.class_name} — {selectedActivity.subject_or_activity}</div>
              <div className="text-surface-600">Teacher: {selectedActivity.teacher_name} • {selectedActivity.time_slot}</div>
            </div>

            <div>
              <label className="label">Delivery Status *</label>
              <Select
                value={assessmentStatus}
                onChange={e => setAssessmentStatus(e.target.value as any)}
                options={[
                  { value: 'completed', label: 'Completed / Conducted Successfully' },
                  { value: 'in_progress', label: 'In Progress (Currently Running)' },
                  { value: 'missed', label: 'Missed / Teacher Absent' },
                  { value: 'deferred', label: 'Deferred / Postponed' },
                  { value: 'scheduled', label: 'Scheduled (Upcoming)' },
                ]}
              />
            </div>

            <div>
              <label className="label">Assessment Remarks & Syllabus Coverage</label>
              <Input
                value={assessmentNotes}
                onChange={e => setAssessmentNotes(e.target.value)}
                placeholder="e.g. Conducted with 90% attendance. Exercise given."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
              <Button variant="outline" type="button" onClick={() => setIsAssessModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Assessment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: UPDATE DUTY STATUS */}
      <Modal
        isOpen={isDutyModalOpen}
        onClose={() => setIsDutyModalOpen(false)}
        title="Update Special Duty Assignment"
        description="Record duty execution and notes"
      >
        {selectedDuty && (
          <form onSubmit={handleSaveDuty} className="space-y-4">
            <div className="p-3 bg-surface-50 rounded-xl space-y-1 text-xs border border-surface-200">
              <div className="font-bold text-surface-900">{selectedDuty.duty_title}</div>
              <div className="text-surface-600">Assigned to: {selectedDuty.responsible_person}</div>
            </div>

            <div>
              <label className="label">Duty Status *</label>
              <Select
                value={dutyStatus}
                onChange={e => setDutyStatus(e.target.value as any)}
                options={[
                  { value: 'completed', label: 'Completed' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'pending', label: 'Pending / Not Started' },
                ]}
              />
            </div>

            <div>
              <label className="label">Execution Notes / Inspection Remarks</label>
              <Input
                value={dutyNotes}
                onChange={e => setDutyNotes(e.target.value)}
                placeholder="e.g. All workstations verified."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
              <Button variant="outline" type="button" onClick={() => setIsDutyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Duty Status
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: END-OF-DAY VOICE & TEXT OPERATIONAL EXECUTIVE REPORT */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          handleStopVoiceReport()
          setIsReportModalOpen(false)
        }}
        title="End-of-Day Executive Operational Briefing"
        description={`Automated synthesis of daily school operations on ${executiveReport.date}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {!isPlayingAudio ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={handlePlayVoiceReport}
                >
                  {isAudioPaused ? 'Resume Voice' : 'Play Voice Briefing'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Pause className="w-3.5 h-3.5" />}
                  onClick={handlePauseVoiceReport}
                >
                  Pause Voice
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Square className="w-3.5 h-3.5" />}
                onClick={handleStopVoiceReport}
                disabled={!isPlayingAudio && !isAudioPaused}
              >
                Stop
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleStopVoiceReport()
                setIsReportModalOpen(false)
              }}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Voice Equalizer Audio Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-900 to-surface-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center ${isPlayingAudio ? 'animate-bounce' : ''}`}>
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">AI Voice Narration Engine</div>
                <div className="text-xs text-primary-200">
                  {isPlayingAudio ? 'Speaking operational daily brief...' : isAudioPaused ? 'Paused' : 'Ready to narrate audio briefing'}
                </div>
              </div>
            </div>
            {isPlayingAudio && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-4 bg-emerald-300 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-pulse delay-150" />
                <span className="w-1.5 h-5 bg-emerald-300 rounded-full animate-pulse delay-200" />
              </div>
            )}
          </div>

          {/* Report Sections: Done vs Not Done */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Has Been Done */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Has Been Done Today</span>
              </div>
              <ul className="text-xs text-emerald-800 space-y-1.5">
                <li>• <strong>{overallAttendanceRate}% Attendance:</strong> {totalPresentToday} students marked present across {classBreakdowns.length} classes.</li>
                <li>• <strong>{executiveReport.completedActivities.length} Lessons Delivered:</strong> Conducted and verified in S.1, S.2, S.5, and S.6.</li>
                <li>• <strong>{executiveReport.completedDuties.length} Special Duties Completed:</strong> Lab preparation, sickbay triage, and IT lab verified.</li>
                <li>• <strong>Ledger Collections:</strong> {formatCurrency(stats.totalCollected)} recorded on official receipts.</li>
              </ul>
            </div>

            {/* What Has NOT Been Done / Pending */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>What Is Pending / Not Done</span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li>• <strong>{totalAbsentToday} Student Absences:</strong> Requires guardian phone contact.</li>
                <li>• <strong>{executiveReport.scheduledActivities.length} Activity Scheduled:</strong> S.4 UNEB Chemistry Mock drill afternoon session.</li>
                <li>• <strong>Library Accession:</strong> New curriculum book cataloging pending delivery clearance.</li>
                <li>• <strong>Receivables:</strong> {formatCurrency(stats.outstandingFees)} outstanding fees pending settlement.</li>
              </ul>
            </div>
          </div>

          {/* Action Plan for Tomorrow */}
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
            <div className="font-bold text-sm text-surface-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>Recommended Action Plan for Tomorrow</span>
            </div>
            <div className="space-y-2">
              {executiveReport.tomorrowPlan.map((plan, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-surface-700">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{plan}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
