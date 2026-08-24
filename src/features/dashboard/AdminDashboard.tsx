import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, GraduationCap, CreditCard, ClipboardCheck, ArrowUpRight,
  TrendingUp, Plus, Calendar, Bell, Shield, BookOpen, AlertCircle
} from 'lucide-react'
import { StatCard, Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate, getStudentStatusConfig, getPaymentStatusConfig } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()
  const navigate = useNavigate()

  const [stats, setStats] = useState(DataService.getStats(institution?.id))
  const [recentStudents, setRecentStudents] = useState(DataService.getStudents(institution?.id).slice(0, 5))
  const [recentPayments, setRecentPayments] = useState(DataService.getPayments(institution?.id).slice(0, 5))
  const [classes, setClasses] = useState(DataService.getClasses(institution?.id))

  useEffect(() => {
    setStats(DataService.getStats(institution?.id))
    setRecentStudents(DataService.getStudents(institution?.id).slice(0, 5))
    setRecentPayments(DataService.getPayments(institution?.id).slice(0, 5))
    setClasses(DataService.getClasses(institution?.id))
  }, [institution?.id])

  // Mock enrollment by class chart data
  const classEnrollmentData = classes.map(c => ({
    name: c.name.split(' ')[0],
    students: c.studentCount || 0,
    capacity: c.capacity || 60,
  }))

  const feeBreakdownData = [
    { name: 'Collected', value: stats.totalCollected, color: '#10b981' },
    { name: 'Outstanding', value: stats.outstandingFees, color: '#f87171' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-primary-200 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentAcademicYear?.name || '2026'} • {currentTerm?.name || 'Term 1'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.profile.full_name || 'Administrator'}
            </h1>
            <p className="text-primary-200 text-sm mt-1 max-w-xl">
              {institution?.name} is operating with {stats.activeStudents} active students across {classes.length} classes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              className="bg-white text-primary-900 hover:bg-surface-100 font-semibold shadow-lg"
              leftIcon={<Plus className="w-4 h-4 text-primary-700" />}
              onClick={() => navigate('/students')}
            >
              Admit Student
            </Button>
            <Button
              variant="secondary"
              className="bg-primary-700/60 hover:bg-primary-700 text-white border border-primary-500/30"
              leftIcon={<CreditCard className="w-4 h-4" />}
              onClick={() => navigate('/fees')}
            >
              Record Fee
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrollment"
          value={stats.totalStudents}
          subtitle={`${stats.activeStudents} active students`}
          icon={<GraduationCap className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
          trend={{ value: 12, label: 'vs last year', positive: true }}
        />
        <StatCard
          title="Staff & Educators"
          value={stats.totalStaff}
          subtitle="Full-time & contracted"
          icon={<Users className="w-6 h-6 text-accent-600" />}
          iconBg="bg-accent-100 text-accent-600"
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(stats.totalCollected)}
          subtitle={`${stats.collectionRate}% of total billed`}
          icon={<TrendingUp className="w-6 h-6 text-success-600" />}
          iconBg="bg-success-100 text-success-600"
          trend={{ value: stats.collectionRate, label: 'collection rate', positive: true }}
        />
        <StatCard
          title="Outstanding Balances"
          value={formatCurrency(stats.outstandingFees)}
          subtitle="Pending recovery"
          icon={<CreditCard className="w-6 h-6 text-danger-600" />}
          iconBg="bg-danger-100 text-danger-600"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Enrollment Chart */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Enrollment by Class</h2>
              <p className="text-xs text-surface-500">Student count vs class maximum capacity</p>
            </div>
            <Link to="/classes" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <span>View Classes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classEnrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="students" name="Enrolled" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Capacity" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fees Recovery Chart */}
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">Term Fee Collection</h2>
            <p className="text-xs text-surface-500">Collected vs outstanding revenue</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {feeBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-100">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-surface-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Collected
              </span>
              <span className="font-bold text-surface-800">{formatCurrency(stats.totalCollected)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-surface-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                Outstanding
              </span>
              <span className="font-bold text-surface-800">{formatCurrency(stats.outstandingFees)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Recent Student Admissions</h2>
              <p className="text-xs text-surface-500">Newly registered students</p>
            </div>
            <Link to="/students" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-surface-100">
            {recentStudents.map(student => {
              const statusCfg = getStudentStatusConfig(student.status)
              return (
                <div key={student.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-surface-800">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-xs text-surface-400">
                      {student.admission_number} • {student.current_class?.name || 'Class'}
                    </div>
                  </div>
                  <Badge variant="success" dot>{statusCfg.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Fee Payments */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Recent Fee Receipts</h2>
              <p className="text-xs text-surface-500">Latest financial transactions</p>
            </div>
            <Link to="/fees" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-surface-100">
            {recentPayments.map(payment => (
              <div key={payment.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">
                    {payment.student?.first_name} {payment.student?.last_name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {payment.receipt?.receipt_number || 'RCP'} • {payment.payment_method}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-600">
                    +{formatCurrency(payment.amount)}
                  </div>
                  <div className="text-[10px] text-surface-400">
                    {formatDate(payment.payment_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
