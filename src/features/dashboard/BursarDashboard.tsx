import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, TrendingUp, AlertCircle, Receipt, ArrowUpRight,
  Plus, CheckCircle2, Download, Printer, Filter, Lock
} from 'lucide-react'
import { StatCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BursaryPinGate } from '@/components/auth/BursaryPinModal'
import { useAuthStore } from '@/store/auth.store'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate, getPaymentStatusConfig } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function BursarDashboard() {
  const { user } = useAuthStore()
  const { institution, currentTerm } = useInstitutionStore()
  const navigate = useNavigate()

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('zentraos_bursary_unlocked') === 'true'
  })

  const stats = DataService.getStats(institution?.id)
  const invoices = DataService.getInvoices(institution?.id)
  const payments = DataService.getPayments(institution?.id)

  function handleLock() {
    sessionStorage.removeItem('zentraos_bursary_unlocked')
    setIsUnlocked(false)
    toast('Bursar & Accounts Department Locked')
  }

  return (
    <div className="space-y-6">
      {/* PIN Security Gate */}
      <BursaryPinGate
        isOpen={!isUnlocked}
        onUnlock={() => setIsUnlocked(true)}
      />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Bursar & Accounts Department • {currentTerm?.name}</span>
          </div>
          <h1 className="text-2xl font-bold">Bursar & Accounts Control</h1>
          <p className="text-emerald-200 text-xs mt-1">
            Total collections for current term: {formatCurrency(stats.totalCollected)} ({stats.collectionRate}% target achieved).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            onClick={handleLock}
          >
            Lock Department
          </Button>
          <Button
            variant="success"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/fees')}
          >
            Record Fee Payment
          </Button>
          <Button
            variant="secondary"
            className="bg-emerald-800/50 text-white hover:bg-emerald-800"
            onClick={() => navigate('/reports')}
          >
            Financial Statements
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Billed Invoices"
          value={formatCurrency(stats.totalBilled)}
          subtitle={`${invoices.length} active fee invoices`}
          icon={<CreditCard className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
        />
        <StatCard
          title="Total Realized Revenue"
          value={formatCurrency(stats.totalCollected)}
          subtitle="Bank, Cash & Mobile Money"
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(stats.outstandingFees)}
          subtitle="Pending parent settlements"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100 text-red-600"
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          subtitle="Target: 95% at midterm"
          icon={<CheckCircle2 className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Invoices and Payments Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Invoices */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Unpaid / Partial Invoices</h2>
              <p className="text-xs text-surface-500">Students with outstanding fee balances</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/fees')}>
              View All Invoices
            </Button>
          </div>

          <div className="divide-y divide-surface-100">
            {invoices.filter(i => i.balance > 0).map(inv => {
              const statusCfg = getPaymentStatusConfig(inv.status)
              return (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-surface-800">
                      {inv.student?.first_name} {inv.student?.last_name}
                    </div>
                    <div className="text-xs text-surface-400">
                      {inv.student?.admission_number} • Due: {formatDate(inv.due_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-red-600">{formatCurrency(inv.balance)}</div>
                    <Badge variant={statusCfg.className as any} className="text-[10px]">{statusCfg.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-surface-900">Recent Payment Receipts</h2>
              <p className="text-xs text-surface-500">Bank deposits and Mobile Money transactions</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/fees')}>
              Export Receipts
            </Button>
          </div>

          <div className="divide-y divide-surface-100">
            {payments.map(pay => (
              <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-surface-800">
                    {pay.student?.first_name} {pay.student?.last_name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {pay.receipt?.receipt_number} • <span className="text-surface-600">{pay.payment_method}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-600">+{formatCurrency(pay.amount)}</div>
                  <div className="text-[10px] text-surface-400">{formatDate(pay.payment_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
