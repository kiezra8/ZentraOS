import { useState } from 'react'
import {
  CreditCard, Plus, Receipt, Search, Filter, Download, Printer,
  CheckCircle2, AlertCircle, ArrowUpRight, DollarSign, Wallet
} from 'lucide-react'
import { SectionHeader, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate, getPaymentStatusConfig } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { StudentInvoice, Payment, FeeType } from '@/types'

export function FeesPage() {
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()

  const [invoices, setInvoices] = useState(() => DataService.getInvoices(institution?.id))
  const [payments, setPayments] = useState(() => DataService.getPayments(institution?.id))
  const [students] = useState(() => DataService.getStudents(institution?.id))
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'structure'>('invoices')

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null)

  // Payment Form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('MTN Mobile Money')
  const [referenceNo, setReferenceNo] = useState('')
  const [notes, setNotes] = useState('')

  // Invoice Form
  const [invoiceStudentId, setInvoiceStudentId] = useState(students[0]?.id || '')
  const [tuitionAmount, setTuitionAmount] = useState('950000')
  const [devAmount, setDevAmount] = useState('150000')
  const [mealsAmount, setMealsAmount] = useState('300000')
  const [uniformAmount, setUniformAmount] = useState('0')

  const stats = DataService.getStats(institution?.id)

  function refreshData() {
    setInvoices(DataService.getInvoices(institution?.id))
    setPayments(DataService.getPayments(institution?.id))
  }

  function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    const inv = invoices.find(i => i.id === selectedInvoiceId)
    if (!inv) return

    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) return toast.error('Enter a valid payment amount')

    const newPayment = DataService.recordPayment({
      institution_id: institution?.id || 'inst-001',
      invoice_id: inv.id,
      student_id: inv.student_id,
      amount,
      currency: 'UGX',
      payment_method: paymentMethod,
      reference_number: referenceNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      received_by: 'usr-bursar',
      notes,
      payment_date: new Date().toISOString().split('T')[0],
    })

    refreshData()
    setIsPaymentOpen(false)
    setPaymentAmount('')
    setReferenceNo('')
    setActiveReceiptPayment(newPayment)
    setIsReceiptOpen(true)
    toast.success('Payment recorded and official receipt generated!')
  }

  function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault()
    const items = [
      { description: 'Tuition Fee', amount: parseFloat(tuitionAmount) || 0 },
      { description: 'Development Levy', amount: parseFloat(devAmount) || 0 },
      { description: 'Meals Program', amount: parseFloat(mealsAmount) || 0 },
      { description: 'Uniform & Attire', amount: parseFloat(uniformAmount) || 0 },
    ].filter(i => i.amount > 0)

    DataService.createInvoice({
      institution_id: institution?.id || 'inst-001',
      student_id: invoiceStudentId,
      academic_year_id: currentAcademicYear?.id || 'ay-2026',
      term_id: currentTerm?.id || 'term-1-2026',
      status: 'outstanding',
      items,
      due_date: '2026-02-28',
    })

    refreshData()
    setIsInvoiceOpen(false)
    toast.success('Student invoice issued successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Fees & Financials"
        subtitle="Manage fee structures, issue student invoices, record payments, and print receipts (Currency: UGX)"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsInvoiceOpen(true)}
            >
              Issue Invoice
            </Button>
            <Button
              variant="primary"
              leftIcon={<Wallet className="w-4 h-4" />}
              onClick={() => setIsPaymentOpen(true)}
            >
              Record Payment
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(stats.totalBilled)}
          subtitle="Term billing total"
          icon={<CreditCard className="w-6 h-6 text-primary-600" />}
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(stats.totalCollected)}
          subtitle={`${stats.collectionRate}% collection rate`}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstandingFees)}
          subtitle="Pending collection"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100 text-red-600"
        />
        <StatCard
          title="Total Receipts"
          value={payments.length}
          subtitle="Issued transactions"
          icon={<Receipt className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Tabs: Invoices vs Payments */}
      <div className="flex items-center gap-2 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Student Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Receipts & Payments ({payments.length})
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <DataTable<StudentInvoice>
          data={invoices}
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (row) => (
                <div>
                  <div className="font-semibold text-surface-900">
                    {row.student?.first_name} {row.student?.last_name}
                  </div>
                  <div className="text-xs text-surface-400 font-mono">
                    {row.student?.admission_number}
                  </div>
                </div>
              ),
            },
            {
              key: 'total_amount',
              header: 'Total Billed',
              render: (row) => (
                <span className="font-semibold text-surface-800">
                  {formatCurrency(row.total_amount)}
                </span>
              ),
            },
            {
              key: 'total_paid',
              header: 'Amount Paid',
              render: (row) => (
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(row.total_paid)}
                </span>
              ),
            },
            {
              key: 'balance',
              header: 'Outstanding',
              render: (row) => (
                <span className="font-bold text-red-600">
                  {formatCurrency(row.balance)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const cfg = getPaymentStatusConfig(row.status)
                return <Badge variant={cfg.className as any} dot>{cfg.label}</Badge>
              },
            },
            {
              key: 'action',
              header: 'Actions',
              className: 'text-right',
              render: (row) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedInvoiceId(row.id)
                    setPaymentAmount(row.balance > 0 ? String(row.balance) : '')
                    setIsPaymentOpen(true)
                  }}
                >
                  Pay
                </Button>
              ),
            },
          ]}
        />
      )}

      {/* TAB 2: PAYMENTS & RECEIPTS TABLE */}
      {activeTab === 'payments' && (
        <DataTable<Payment>
          data={payments}
          columns={[
            {
              key: 'receipt',
              header: 'Receipt No',
              render: (row) => (
                <span className="font-mono font-bold text-primary-700 text-xs">
                  {row.receipt?.receipt_number || 'RCP-2026'}
                </span>
              ),
            },
            {
              key: 'student',
              header: 'Student',
              render: (row) => (
                <div className="font-semibold text-surface-900">
                  {row.student?.first_name} {row.student?.last_name}
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Amount Paid',
              render: (row) => (
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(row.amount)}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Channel & Reference',
              render: (row) => (
                <div className="text-xs">
                  <div className="font-medium text-surface-800">{row.payment_method}</div>
                  <div className="text-surface-400 font-mono">{row.reference_number || '—'}</div>
                </div>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              render: (row) => (
                <span className="text-xs text-surface-600">{formatDate(row.payment_date)}</span>
              ),
            },
            {
              key: 'print',
              header: 'Receipt',
              className: 'text-right',
              render: (row) => (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveReceiptPayment(row)
                    setIsReceiptOpen(true)
                  }}
                >
                  Print
                </Button>
              ),
            },
          ]}
        />
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Fee Payment"
        description="Issue official bursary receipt for student fees"
      >
        <form onSubmit={handleRecordPayment} className="space-y-3">
          <div>
            <label className="label">Target Invoice / Student *</label>
            <Select
              options={invoices.map(i => ({
                value: i.id,
                label: `${i.student?.first_name} ${i.student?.last_name} (Bal: ${formatCurrency(i.balance)})`,
              }))}
              value={selectedInvoiceId}
              onChange={e => setSelectedInvoiceId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (UGX) *</label>
              <Input
                type="number"
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <Select
                options={[
                  { value: 'MTN Mobile Money', label: 'MTN Mobile Money' },
                  { value: 'Airtel Money', label: 'Airtel Money' },
                  { value: 'Stanbic Bank Deposit', label: 'Stanbic Bank Deposit Slip' },
                  { value: 'Centenary Bank', label: 'Centenary Bank Deposit' },
                  { value: 'DFCU Bank', label: 'DFCU Bank Deposit' },
                  { value: 'Cash at Bursary', label: 'Direct Cash (Bursary Desk)' },
                  { value: 'Cheque / Bank Draft', label: 'Bank Cheque' },
                ]}
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Transaction Reference / Bank Slip Number</label>
            <Input
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="e.g. DEP-SB-892144 or MOMO TXID"
            />
          </div>

          <div>
            <label className="label">Bursar Notes</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Term 1 partial settlement"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Record & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* ISSUE INVOICE MODAL */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Issue Student Fee Invoice"
        description="Generate term fee bill for a student"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3">
          <div>
            <label className="label">Select Student *</label>
            <Select
              options={students.map(s => ({
                value: s.id,
                label: `${s.first_name} ${s.last_name} (${s.admission_number})`,
              }))}
              value={invoiceStudentId}
              onChange={e => setInvoiceStudentId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tuition Fee (UGX)</label>
              <Input
                type="number"
                value={tuitionAmount}
                onChange={e => setTuitionAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Development Levy (UGX)</label>
              <Input
                type="number"
                value={devAmount}
                onChange={e => setDevAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Meals Fee (UGX)</label>
              <Input
                type="number"
                value={mealsAmount}
                onChange={e => setMealsAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Uniform & Kit (UGX)</label>
              <Input
                type="number"
                value={uniformAmount}
                onChange={e => setUniformAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE RECEIPT MODAL */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Official School Fees Receipt"
        size="md"
        footer={
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print Official Receipt
          </Button>
        }
      >
        {activeReceiptPayment && (
          <div className="space-y-4 p-5 border-2 border-surface-300 rounded-2xl bg-white text-surface-900">
            <div className="text-center border-b border-surface-200 pb-3">
              <h2 className="text-lg font-extrabold tracking-tight uppercase">{institution?.name}</h2>
              <p className="text-xs text-surface-500">{institution?.address} • Phone: {institution?.phone}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-surface-100 rounded-full font-mono text-xs font-bold text-primary-700">
                {activeReceiptPayment.receipt?.receipt_number || 'OFFICIAL RECEIPT'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-surface-400">Date Issued: </span>
                <span className="font-semibold">{formatDate(activeReceiptPayment.payment_date)}</span>
              </div>
              <div>
                <span className="text-surface-400">Payment Channel: </span>
                <span className="font-semibold">{activeReceiptPayment.payment_method}</span>
              </div>
              <div>
                <span className="text-surface-400">Student: </span>
                <span className="font-bold text-surface-900">
                  {activeReceiptPayment.student?.first_name} {activeReceiptPayment.student?.last_name}
                </span>
              </div>
              <div>
                <span className="text-surface-400">Reference No: </span>
                <span className="font-mono">{activeReceiptPayment.reference_number || '—'}</span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center space-y-0.5">
              <div className="text-xs text-emerald-800 font-semibold uppercase">Amount Received</div>
              <div className="text-2xl font-extrabold text-emerald-700">
                {formatCurrency(activeReceiptPayment.amount)}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-surface-500 border-t border-surface-200 pt-3">
              <span>Bursar: {activeReceiptPayment.receipt?.issued_by || 'Grace Atuhaire'}</span>
              <span className="font-semibold text-primary-600">Generated by ZentraOS</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
