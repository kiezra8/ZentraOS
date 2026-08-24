import { useState } from 'react'
import {
  BarChart3, Download, Printer, FileSpreadsheet, FileText,
  Users, CreditCard, ClipboardCheck, GraduationCap, ArrowUpRight
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function ReportsPage() {
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()
  const stats = DataService.getStats(institution?.id)
  const students = DataService.getStudents(institution?.id)
  const classes = DataService.getClasses(institution?.id)
  const invoices = DataService.getInvoices(institution?.id)
  const payments = DataService.getPayments(institution?.id)

  const [activeReport, setActiveReport] = useState<'enrollment' | 'fees' | 'attendance'>('enrollment')

  function handleExportCSV(reportType: string) {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (reportType === 'enrollment') {
      csvContent += 'Admission Number,Full Name,Class,Gender,Status\n'
      students.forEach(s => {
        csvContent += `"${s.admission_number}","${s.first_name} ${s.last_name}","${s.current_class?.name || ''}","${s.gender}","${s.status}"\n`
      })
    } else if (reportType === 'fees') {
      csvContent += 'Student Name,Admission No,Total Billed,Amount Paid,Balance,Status\n'
      invoices.forEach(i => {
        csvContent += `"${i.student?.first_name} ${i.student?.last_name}","${i.student?.admission_number}",${i.total_amount},${i.total_paid},${i.balance},"${i.status}"\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ZentraOS_${reportType}_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${reportType} report as CSV`)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Institutional Reports"
        subtitle="Generate and export demographic, financial, and academic performance data"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
            <Button
              variant="primary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCSV(activeReport)}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Report Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveReport('enrollment')}
          className={`card p-5 text-left transition-all ${
            activeReport === 'enrollment'
              ? 'ring-2 ring-primary-500 bg-primary-50/20'
              : 'hover:border-surface-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-surface-900">Student Enrollment & Demographics</h3>
          <p className="text-xs text-surface-500 mt-1">Class distributions, gender parity, and active counts.</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('fees')}
          className={`card p-5 text-left transition-all ${
            activeReport === 'fees'
              ? 'ring-2 ring-primary-500 bg-primary-50/20'
              : 'hover:border-surface-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-surface-900">Fee Collection & Receivables</h3>
          <p className="text-xs text-surface-500 mt-1">Term collections, outstanding debt, and payment channels.</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('attendance')}
          className={`card p-5 text-left transition-all ${
            activeReport === 'attendance'
              ? 'ring-2 ring-primary-500 bg-primary-50/20'
              : 'hover:border-surface-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-surface-900">Attendance Statistics</h3>
          <p className="text-xs text-surface-500 mt-1">Class presence rates, absences, and punctuality.</p>
        </button>
      </div>

      {/* REPORT CONTENT VIEW */}
      {activeReport === 'enrollment' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Enrollment by Class Level</h2>
              <p className="text-xs text-surface-500">{currentAcademicYear?.name} summary breakdown</p>
            </div>
            <Badge variant="primary">{students.length} Total Enrolled</Badge>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Level Section</th>
                  <th>Enrolled</th>
                  <th>Capacity</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const utilization = c.capacity ? Math.round(((c.studentCount || 0) / c.capacity) * 100) : 0
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold text-surface-900">{c.name}</td>
                      <td><Badge variant="surface">{c.type || 'Standard'}</Badge></td>
                      <td className="font-bold text-primary-700">{c.studentCount || 0}</td>
                      <td className="text-surface-600">{c.capacity || 60}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-surface-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary-600 h-full" style={{ width: `${utilization}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-surface-700">{utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'fees' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Fee Invoices & Settlement Register</h2>
              <p className="text-xs text-surface-500">Collected: {formatCurrency(stats.totalCollected)} • Outstanding: {formatCurrency(stats.outstandingFees)}</p>
            </div>
            <Badge variant="success">Collection Rate: {stats.collectionRate}%</Badge>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Billed Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-semibold text-surface-900">{inv.student?.first_name} {inv.student?.last_name}</td>
                    <td className="font-mono text-xs text-surface-500">{inv.student?.admission_number}</td>
                    <td className="font-medium text-surface-800">{formatCurrency(inv.total_amount)}</td>
                    <td className="font-medium text-emerald-600">{formatCurrency(inv.total_paid)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(inv.balance)}</td>
                    <td>
                      <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'danger'}>
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'attendance' && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">Class Attendance Summary</h2>
            <p className="text-xs text-surface-500">Term 1 overall attendance indicators</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200">
              <span className="text-xs text-surface-500">Average School Attendance</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">97.8%</div>
              <span className="text-[11px] text-surface-400">Consistent with term targets</span>
            </div>
            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200">
              <span className="text-xs text-surface-500">Unexcused Absences</span>
              <div className="text-2xl font-bold text-red-600 mt-1">2.2%</div>
              <span className="text-[11px] text-surface-400">Follow-up notifications sent to parents</span>
            </div>
            <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200">
              <span className="text-xs text-surface-500">Punctuality Rate</span>
              <div className="text-2xl font-bold text-primary-600 mt-1">94.1%</div>
              <span className="text-[11px] text-surface-400">Morning assembly arrival before 8:00 AM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
