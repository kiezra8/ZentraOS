import { useState, useMemo } from 'react'
import {
  ClipboardCheck, Calendar, Clock, CheckCircle2, XCircle,
  AlertTriangle, HelpCircle, Save, Wifi, WifiOff, Users, ArrowRight,
  Filter, Check, Sparkles
} from 'lucide-react'
import { SectionHeader, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useInstitutionStore } from '@/store/institution.store'
import { useSyncStore } from '@/store/sync.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { AttendanceStatus, Student } from '@/types'

export function AttendancePage() {
  const { institution, currentTerm } = useInstitutionStore()
  const { status: connStatus } = useSyncStore()

  const [classes] = useState(() => DataService.getClasses(institution?.id))
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedPeriod, setSelectedPeriod] = useState('Morning Roll Call')
  const [isSaving, setIsSaving] = useState(false)

  // Students in selected class
  const classStudents = useMemo(() => {
    return DataService.getStudents(institution?.id).filter(
      s => s.current_class_id === selectedClassId
    )
  }, [selectedClassId, institution?.id])

  // Attendance state map: { studentId: 'present' | 'absent' | 'late' | 'excused' }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {}
    DataService.getStudents(institution?.id).forEach(s => {
      map[s.id] = 'present' // default present
    })
    return map
  })

  // Attendance notes map
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})

  // Stats calculation
  const totalInClass = classStudents.length
  const presentCount = classStudents.filter(s => (attendanceMap[s.id] || 'present') === 'present').length
  const absentCount = classStudents.filter(s => attendanceMap[s.id] === 'absent').length
  const lateCount = classStudents.filter(s => attendanceMap[s.id] === 'late').length
  const excusedCount = classStudents.filter(s => attendanceMap[s.id] === 'excused').length
  const attendanceRate = totalInClass > 0 ? Math.round(((presentCount + lateCount) / totalInClass) * 100) : 100

  // Set all students to a given status
  function handleMarkAll(status: AttendanceStatus) {
    const updated = { ...attendanceMap }
    classStudents.forEach(s => {
      updated[s.id] = status
    })
    setAttendanceMap(updated)
    toast.success(`Marked all ${classStudents.length} students as ${status}`)
  }

  // Toggle status for single student
  function handleSetStatus(studentId: string, status: AttendanceStatus) {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status,
    }))
  }

  // Save session
  async function handleSaveAttendance() {
    setIsSaving(true)

    const records = classStudents.map(s => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'present',
      notes: notesMap[s.id] || '',
    }))

    try {
      await DataService.saveAttendanceSession(
        {
          institution_id: institution?.id || 'inst-001',
          class_id: selectedClassId,
          date: selectedDate,
          period: selectedPeriod,
          term_id: currentTerm?.id || 'term-1-2026',
          taken_by: 'usr-teacher',
        },
        records
      )

      setIsSaving(false)
      toast.success('Attendance saved & synchronized successfully!')
    } catch (e) {
      setIsSaving(false)
      toast.error('Failed to save attendance')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Student Attendance Register"
        subtitle="Mark daily class register with offline support and automatic synchronisation"
        action={
          <Button
            variant="success"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            onClick={handleSaveAttendance}
          >
            Save Register
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 bg-emerald-50/70 border-emerald-200">
          <div className="text-xs font-semibold text-emerald-800">Present</div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{presentCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">{totalInClass > 0 ? Math.round((presentCount / totalInClass) * 100) : 0}% of class</div>
        </div>

        <div className="card p-4 bg-red-50/70 border-red-200">
          <div className="text-xs font-semibold text-red-800">Absent</div>
          <div className="text-2xl font-bold text-red-700 mt-0.5">{absentCount}</div>
          <div className="text-[11px] text-red-600 mt-0.5">Unexcused</div>
        </div>

        <div className="card p-4 bg-amber-50/70 border-amber-200">
          <div className="text-xs font-semibold text-amber-800">Late Arrival</div>
          <div className="text-2xl font-bold text-amber-700 mt-0.5">{lateCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Arrived after roll call</div>
        </div>

        <div className="card p-4 bg-blue-50/70 border-blue-200">
          <div className="text-xs font-semibold text-blue-800">Attendance Rate</div>
          <div className="text-2xl font-bold text-blue-700 mt-0.5">{attendanceRate}%</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Overall presence</div>
        </div>
      </div>

      {/* Controls: Class, Date, Period, Quick Batch buttons */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label text-xs">Select Class</label>
            <Select
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs">Session Period</label>
            <Select
              options={[
                { value: 'Morning Roll Call', label: 'Morning Roll Call (08:00 AM)' },
                { value: 'Afternoon Roll Call', label: 'Afternoon Roll Call (02:00 PM)' },
                { value: 'Evening Prep', label: 'Evening Boarding Prep' },
              ]}
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
            />
          </div>
        </div>

        {/* Batch Actions */}
        <div className="pt-2 border-t border-surface-100 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-surface-500 font-medium">
            Quick Batch Actions for {classStudents.length} Students:
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleMarkAll('present')}
              className="btn btn-sm btn-outline text-emerald-700 hover:bg-emerald-50 text-xs"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="btn btn-sm btn-outline text-red-700 hover:bg-red-50 text-xs"
            >
              ✕ Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Student Roster (Mobile-Optimized Touch Buttons) */}
      <div className="space-y-3">
        {classStudents.map((student, idx) => {
          const currentStatus = attendanceMap[student.id] || 'present'
          return (
            <div
              key={student.id}
              className={`card p-4 transition-all ${
                currentStatus === 'present'
                  ? 'border-emerald-200 bg-white'
                  : currentStatus === 'absent'
                  ? 'border-red-200 bg-red-50/20'
                  : currentStatus === 'late'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-surface-200 bg-surface-50/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-700 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-surface-900">
                      {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
                    </div>
                    <div className="text-xs text-surface-400">
                      {student.admission_number} • {student.gender.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Touch-Friendly Status Selection Buttons */}
                <div className="grid grid-cols-4 sm:flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.id, 'present')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.id, 'absent')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                      currentStatus === 'absent'
                        ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.id, 'late')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                      currentStatus === 'late'
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.id, 'excused')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
                      currentStatus === 'excused'
                        ? 'bg-surface-700 text-white shadow-sm'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    Excused
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
