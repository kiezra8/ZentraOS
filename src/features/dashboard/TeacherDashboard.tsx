import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ClipboardList, Clock, Calendar, CheckCircle2,
  FileEdit, ArrowRight, UserCheck, AlertTriangle
} from 'lucide-react'
import { StatCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'

export function TeacherDashboard() {
  const { user } = useAuthStore()
  const { institution, currentTerm } = useInstitutionStore()
  const navigate = useNavigate()

  const classes = DataService.getClasses(institution?.id)
  const exams = DataService.getExams(institution?.id)

  const todaySchedule = [
    { period: '08:30 - 09:50 AM', class: 'Senior One (S.1)', subject: 'Mathematics (Calculus & Sets)', room: 'Room 12B', status: 'Completed' },
    { period: '10:10 - 11:30 AM', class: 'Senior Two (S.2)', subject: 'Physics (Mechanics & Waves)', room: 'Physics Lab 1', status: 'In Progress' },
    { period: '02:00 - 03:20 PM', class: 'Senior Four (S.4)', subject: 'Mathematics (UNEB Revision)', room: 'Hall North', status: 'Upcoming' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-surface-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Teacher Workspace • {currentTerm?.name}</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user?.profile.full_name}</h1>
          <p className="text-surface-300 text-xs mt-1">
            You have 3 active teaching periods scheduled today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<ClipboardList className="w-4 h-4" />}
            onClick={() => navigate('/attendance')}
          >
            Mark Attendance
          </Button>
          <Button
            variant="secondary"
            className="bg-surface-700 text-white hover:bg-surface-600"
            leftIcon={<FileEdit className="w-4 h-4" />}
            onClick={() => navigate('/exams')}
          >
            Enter Marks
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Classes"
          value={classes.length}
          subtitle="S.1 Blue, S.2 Gold, S.4 Candidates"
          icon={<BookOpen className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
        />
        <StatCard
          title="Today's Attendance"
          value="96.4%"
          subtitle="Marked across 2 morning streams"
          icon={<ClipboardList className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Pending Exam Marks"
          value={exams.length}
          subtitle="Midterm assessments awaiting entry"
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Timetable Schedule & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Today's Class Schedule</h2>
              <p className="text-xs text-surface-500">Live timetable breakdown for today</p>
            </div>
            <span className="badge badge-primary text-xs">Live Schedule</span>
          </div>

          <div className="divide-y divide-surface-100">
            {todaySchedule.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600 font-bold text-xs flex-shrink-0">
                    P{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-surface-800">{item.subject}</div>
                    <div className="text-xs text-surface-500">
                      {item.class} • <span className="text-surface-700 font-medium">{item.room}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-surface-700">{item.period}</div>
                  <Badge
                    variant={item.status === 'Completed' ? 'success' : item.status === 'In Progress' ? 'warning' : 'surface'}
                    className="text-[10px] mt-0.5"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Pending Tasks */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-surface-900">Pending Tasks</h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-900">Submit S.1 Midterm Marks</div>
                <Badge variant="warning" className="text-[10px]">Due in 2 days</Badge>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">12 student marks remaining for S.1 Mathematics.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-2.5 w-full bg-amber-600 hover:bg-amber-700 text-xs"
                onClick={() => navigate('/exams')}
              >
                Complete Marks Entry
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200">
              <div className="text-xs font-bold text-surface-900">Roll Call S.2 Afternoon</div>
              <p className="text-[11px] text-surface-500 mt-1">Stream Gold afternoon register opens at 2:00 PM.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5 w-full text-xs"
                onClick={() => navigate('/attendance')}
              >
                Open Attendance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
