import {
  GraduationCap, Calendar, Clock, BookOpen, Award, CheckCircle2,
  FileText, Download, Bell, Sparkles
} from 'lucide-react'
import { StatCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'

export function StudentDashboard() {
  const { user } = useAuthStore()
  const { institution, currentTerm } = useInstitutionStore()

  const todayClasses = [
    { time: '08:30 - 09:50 AM', subject: 'Mathematics (Calculus)', teacher: 'Mr. Emmanuel Okello', room: 'Room 12B', status: 'Completed' },
    { time: '10:10 - 11:30 AM', subject: 'Physics (Mechanics)', teacher: 'Mr. Emmanuel Okello', room: 'Physics Lab 1', status: 'In Progress' },
    { time: '11:45 - 01:00 PM', subject: 'Chemistry (Organic Compounds)', teacher: 'Ms. Sarah Nalubega', room: 'Chemistry Lab', status: 'Upcoming' },
    { time: '02:00 - 03:20 PM', subject: 'English Literature', teacher: 'Mrs. Florence Akello', room: 'Room 12B', status: 'Upcoming' },
  ]

  const myResults = [
    { subject: 'Mathematics', score: 88, grade: 'D1', rank: '2nd / 45' },
    { subject: 'Physics', score: 82, grade: 'D1', rank: '4th / 45' },
    { subject: 'Chemistry', score: 79, grade: 'D2', rank: '6th / 45' },
    { subject: 'English Language', score: 76, grade: 'D2', rank: '8th / 45' },
    { subject: 'Biology', score: 84, grade: 'D1', rank: '3rd / 45' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary-950 via-indigo-900 to-surface-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Portal • Senior 1 Blue</span>
          </div>
          <h1 className="text-2xl font-bold">Hello, {user?.profile.full_name}</h1>
          <p className="text-primary-200 text-xs mt-1">
            {institution?.name} • Keep up the great work in {currentTerm?.name || 'Term 1'}!
          </p>
        </div>

        <Button variant="primary" className="bg-white text-primary-900 hover:bg-surface-100 font-semibold" leftIcon={<Download className="w-4 h-4" />}>
          Download Result Slip
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Term Attendance"
          value="98.2%"
          subtitle="48 / 49 days present"
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Overall Performance"
          value="81.8%"
          subtitle="Aggregate: Division 1 (Distinction)"
          icon={<Award className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Class Ranking"
          value="3rd"
          subtitle="Out of 45 students in Stream Blue"
          icon={<Sparkles className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
        />
      </div>

      {/* Timetable & Subject Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Today's Class Schedule</h2>
              <p className="text-xs text-surface-500">Live timetable for Senior 1 Blue</p>
            </div>
            <span className="badge badge-primary text-xs">Today</span>
          </div>

          <div className="divide-y divide-surface-100">
            {todayClasses.map((cls, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">{cls.subject}</div>
                  <div className="text-xs text-surface-400">{cls.teacher} • <span className="font-medium text-surface-600">{cls.room}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-surface-700">{cls.time}</div>
                  <Badge variant={cls.status === 'Completed' ? 'success' : cls.status === 'In Progress' ? 'warning' : 'surface'} className="text-[10px] mt-0.5">
                    {cls.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Marks */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Subject Assessment Marks</h2>
              <p className="text-xs text-surface-500">Continuous Assessment & Midterms</p>
            </div>
            <Badge variant="success">All Published</Badge>
          </div>

          <div className="divide-y divide-surface-100">
            {myResults.map((r, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">{r.subject}</div>
                  <div className="text-xs text-surface-400">Class Rank: {r.rank}</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold text-sm text-primary-700">{r.score}%</span>
                  <Badge variant="primary" className="text-[10px] font-bold">{r.grade}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
