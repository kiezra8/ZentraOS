import { useState } from 'react'
import {
  Users, GraduationCap, CreditCard, ClipboardCheck, Calendar,
  Award, FileText, Download, CheckCircle2, AlertCircle, Phone
} from 'lucide-react'
import { StatCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate } from '@/lib/utils'

export function ParentDashboard() {
  const { user } = useAuthStore()
  const { institution, currentTerm } = useInstitutionStore()

  const students = DataService.getStudents(institution?.id)
  // Demo child is Brian Kigozi
  const child = students[0]
  const invoices = DataService.getInvoices(institution?.id).filter(i => i.student_id === child?.id)
  const payments = DataService.getPayments(institution?.id).filter(p => p.student_id === child?.id)

  const childMarks = [
    { subject: 'Mathematics', score: 88, grade: 'D1 (Distinction)', remarks: 'Excellent computational problem solving' },
    { subject: 'English Language', score: 76, grade: 'D2 (Distinction)', remarks: 'Strong essay writing and comprehension' },
    { subject: 'Physics', score: 82, grade: 'D1 (Distinction)', remarks: 'Very competent in laboratory physics' },
    { subject: 'Chemistry', score: 79, grade: 'D2 (Distinction)', remarks: 'Solid understanding of chemical bonding' },
    { subject: 'Biology', score: 84, grade: 'D1 (Distinction)', remarks: 'Clear cell biology diagrams and theory' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-surface-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Parent Portal • {institution?.name}</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user?.profile.full_name}</h1>
          <p className="text-blue-200 text-xs mt-1">
            Tracking academic progress, attendance and school fee accounts for <span className="font-semibold text-white">{child?.first_name} {child?.last_name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" leftIcon={<CreditCard className="w-4 h-4" />}>
            Pay Fees via MoMo
          </Button>
          <Button variant="secondary" className="bg-surface-800 text-white hover:bg-surface-700" leftIcon={<Download className="w-4 h-4" />}>
            Download Report Card
          </Button>
        </div>
      </div>

      {/* Child Summary Card */}
      <div className="card bg-gradient-to-br from-white to-surface-50 border-primary-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
            {child?.first_name[0]}{child?.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-surface-900">{child?.first_name} {child?.last_name}</h2>
              <Badge variant="success" dot>Active</Badge>
            </div>
            <div className="text-xs text-surface-500 mt-0.5">
              Admission No: <span className="font-semibold text-surface-800">{child?.admission_number}</span> • Class: <span className="font-semibold text-surface-800">{child?.current_class?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-surface-400">Attendance</div>
            <div className="font-bold text-emerald-600 text-base">98.2%</div>
          </div>
          <div className="h-8 w-px bg-surface-200" />
          <div>
            <div className="text-xs text-surface-400">Term Average</div>
            <div className="font-bold text-primary-600 text-base">81.8% (D1)</div>
          </div>
          <div className="h-8 w-px bg-surface-200" />
          <div>
            <div className="text-xs text-surface-400">Fees Balance</div>
            <div className="font-bold text-emerald-600 text-base">UGX 0 (Paid)</div>
          </div>
        </div>
      </div>

      {/* Academic Marks & Fee Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Exam Marks */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Term 1 Assessment Marks</h2>
              <p className="text-xs text-surface-500">Official subject scores & teacher remarks</p>
            </div>
            <span className="badge badge-primary text-xs">Term 1, 2026</span>
          </div>

          <div className="divide-y divide-surface-100">
            {childMarks.map((mk, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">{mk.subject}</div>
                  <div className="text-xs text-surface-500">{mk.remarks}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-primary-700">{mk.score}%</div>
                  <span className="badge badge-success text-[10px]">{mk.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Payment History */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Fees & Receipts History</h2>
              <p className="text-xs text-surface-500">Receipts generated by the school bursar</p>
            </div>
            <Badge variant="success">Fully Settled</Badge>
          </div>

          <div className="divide-y divide-surface-100">
            {payments.map(pay => (
              <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">
                    Receipt #{pay.receipt?.receipt_number}
                  </div>
                  <div className="text-xs text-surface-400">
                    {pay.payment_method} • {formatDate(pay.payment_date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-600">{formatCurrency(pay.amount)}</div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Verified Bank Settlement</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between text-xs">
            <span className="text-surface-600">Need school fees support or bank slips assistance?</span>
            <span className="font-semibold text-primary-600">Call Bursar: +256 752 334455</span>
          </div>
        </div>
      </div>
    </div>
  )
}
