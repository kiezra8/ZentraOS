import { useState, useEffect } from 'react'
import {
  CreditCard, Plus, Receipt, Search, Filter, Download, Printer,
  CheckCircle2, AlertCircle, ArrowUpRight, DollarSign, Wallet,
  Lock, Unlock, ShieldCheck, FileSpreadsheet, Eye, Sparkles, Building
} from 'lucide-react'
import { SectionHeader, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { BursaryPinGate, BURSAR_REQUIRED_PIN } from '@/components/auth/BursaryPinModal'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatCurrency, formatDate, getPaymentStatusConfig } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import type { StudentInvoice, Payment, FeeStructure, Student } from '@/types'

export function FeesPage() {
  const { institution, currentAcademicYear, currentTerm } = useInstitutionStore()

  // PIN Protection State
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('zentraos_bursary_unlocked') === 'true'
  })

  // Data states
  const [invoices, setInvoices] = useState<StudentInvoice[]>(() => DataService.getInvoices(institution?.id))
  const [payments, setPayments] = useState<Payment[]>(() => DataService.getPayments(institution?.id))
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => DataService.getFeeStructures(institution?.id))
  const [students, setStudents] = useState<Student[]>(() => DataService.getStudents(institution?.id))

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'ledger' | 'rates'>('invoices')

  // Search & Filters
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [isFeeRateOpen, setIsFeeRateOpen] = useState(false)
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null)
  const [activeStatementInvoice, setActiveStatementInvoice] = useState<StudentInvoice | null>(null)

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
  const [boardingAmount, setBoardingAmount] = useState('0')

  // Fee Rate Form
  const [newFeeName, setNewFeeName] = useState('')
  const [newFeeAmount, setNewFeeAmount] = useState('')
  const [newFeeType, setNewFeeType] = useState<any>('tuition')
  const [newFeeMandatory, setNewFeeMandatory] = useState(true)

  const stats = DataService.getStats(institution?.id)

  function refreshData() {
    setInvoices(DataService.getInvoices(institution?.id))
    setPayments(DataService.getPayments(institution?.id))
    setFeeStructures(DataService.getFeeStructures(institution?.id))
  }

  function handleLockVault() {
    sessionStorage.removeItem('zentraos_bursary_unlocked')
    setIsUnlocked(false)
    toast('Bursar & Accounts Department Locked')
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
      reference_number: referenceNo || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      received_by: 'Grace Atuhaire (Bursar)',
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
      { description: 'Tuition Fee (Standard Term)', amount: parseFloat(tuitionAmount) || 0 },
      { description: 'Development & Science Lab Levy', amount: parseFloat(devAmount) || 0 },
      { description: 'Meals Program', amount: parseFloat(mealsAmount) || 0 },
      { description: 'Uniform & Sports Attire', amount: parseFloat(uniformAmount) || 0 },
      { description: 'Full Boarding & Accommodation', amount: parseFloat(boardingAmount) || 0 },
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

  function handleCreateFeeStructure(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(newFeeAmount) || 0
    if (!newFeeName || amount <= 0) return toast.error('Please enter valid fee name and amount')

    DataService.createFeeStructure({
      institution_id: institution?.id || 'inst-001',
      academic_year_id: currentAcademicYear?.id || 'ay-2026',
      term_id: currentTerm?.id || 'term-1-2026',
      name: newFeeName,
      amount,
      currency: 'UGX',
      fee_type: newFeeType,
      is_mandatory: newFeeMandatory,
    })

    refreshData()
    setIsFeeRateOpen(false)
    setNewFeeName('')
    setNewFeeAmount('')
    toast.success('Fee rate category registered!')
  }

  function handleExportLedgerCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Receipt Number,Student Name,Admission No,Amount (UGX),Payment Method,Reference No,Date,Bursar\n'
    payments.forEach(p => {
      csvContent += `"${p.receipt?.receipt_number || 'RCP'}","${p.student?.first_name} ${p.student?.last_name}","${p.student?.admission_number}",${p.amount},"${p.payment_method}","${p.reference_number || ''}","${p.payment_date}","${p.received_by}"\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ZentraOS_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Financial ledger exported to CSV')
  }

  // Filtered lists
  const filteredInvoices = invoices.filter(i => {
    const matchSearch = `${i.student?.first_name} ${i.student?.last_name} ${i.student?.admission_number}`
      .toLowerCase()
      .includes(invoiceSearch.toLowerCase())
    const matchStatus = !statusFilter || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredPayments = payments.filter(p => {
    const matchSearch = `${p.student?.first_name} ${p.student?.last_name} ${p.receipt?.receipt_number} ${p.reference_number || ''}`
      .toLowerCase()
      .includes(paymentSearch.toLowerCase())
    const matchMethod = !paymentMethodFilter || p.payment_method === paymentMethodFilter
    return matchSearch && matchMethod
  })

  const methodTotals = payments.reduce((acc, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* PIN Security Gate Overlay */}
      <BursaryPinGate
        isOpen={!isUnlocked}
        onUnlock={() => setIsUnlocked(true)}
      />

      {/* Header */}
      <SectionHeader
        title="Bursar & Accounts Department"
        subtitle="Manage official fee structures, student invoices, receipts, and cash flows (Ugandan Shillings - UGX)"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Lock className="w-3.5 h-3.5 text-amber-500" />}
              onClick={handleLockVault}
              title="Lock Bursar & Accounts Portal"
            >
              Lock Department
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportLedgerCSV}
            >
              Export Ledger
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsInvoiceOpen(true)}
            >
              Issue Invoice
            </Button>
            <Button
              variant="success"
              leftIcon={<Wallet className="w-4 h-4" />}
              onClick={() => setIsPaymentOpen(true)}
            >
              Receive Payment
            </Button>
          </div>
        }
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Billed Revenue"
          value={formatCurrency(stats.totalBilled)}
          subtitle={`${invoices.length} active invoices`}
          icon={<CreditCard className="w-6 h-6 text-primary-600" />}
          iconBg="bg-primary-100 text-primary-600"
        />
        <StatCard
          title="Realized Collections"
          value={formatCurrency(stats.totalCollected)}
          subtitle={`${stats.collectionRate}% target achieved`}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={{ value: stats.collectionRate, label: 'collection efficiency', positive: true }}
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(stats.outstandingFees)}
          subtitle="Pending student settlements"
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100 text-red-600"
        />
        <StatCard
          title="Receipted Transactions"
          value={payments.length}
          subtitle="Bank, Cash & Mobile Money"
          icon={<Receipt className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Organized Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'invoices'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Student Invoices & Receivables ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Payment Receipts Ledger ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ledger'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Accounts Ledger & Revenue Breakdown
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'rates'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          Fee Structure Rates ({feeStructures.length})
        </button>
      </div>

      {/* TAB 1: INVOICES & RECEIVABLES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Filter by student name or admission number..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                leftAdornment={<Search className="w-4 h-4" />}
              />
              <Select
                options={[
                  { value: '', label: 'All Payment Statuses' },
                  { value: 'paid', label: 'Fully Paid (Balance 0)' },
                  { value: 'partial', label: 'Partially Paid (Installments)' },
                  { value: 'outstanding', label: 'Outstanding (Unpaid)' },
                ]}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              />
            </div>
          </div>

          <DataTable<StudentInvoice>
            data={filteredInvoices}
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
                      {row.student?.admission_number} • {row.student?.current_class?.name || 'Class'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'total_amount',
                header: 'Billed Amount',
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
                header: 'Balance Due',
                render: (row) => (
                  <span className={`font-bold ${row.balance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
                  <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setActiveStatementInvoice(row)
                        setIsStatementOpen(true)
                      }}
                      title="View Statement & Clearance"
                    >
                      Statement
                    </Button>
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
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 2: RECEIPTS & PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Search by receipt number, reference, or student name..."
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                leftAdornment={<Search className="w-4 h-4" />}
              />
              <Select
                options={[
                  { value: '', label: 'All Payment Methods' },
                  { value: 'MTN Mobile Money', label: 'MTN Mobile Money' },
                  { value: 'Airtel Money', label: 'Airtel Money' },
                  { value: 'Stanbic Bank (Bank Deposit Slip)', label: 'Stanbic Bank Deposit' },
                  { value: 'Centenary Bank', label: 'Centenary Bank Deposit' },
                  { value: 'Cash at Accounts Desk', label: 'Cash at Accounts Desk' },
                ]}
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
              />
            </div>
          </div>

          <DataTable<Payment>
            data={filteredPayments}
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
                  <div>
                    <div className="font-semibold text-surface-900">
                      {row.student?.first_name} {row.student?.last_name}
                    </div>
                    <div className="text-[11px] text-surface-400 font-mono">
                      {row.student?.admission_number}
                    </div>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'Amount Received',
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
                header: 'Date Recorded',
                render: (row) => (
                  <span className="text-xs text-surface-600">{formatDate(row.payment_date)}</span>
                ),
              },
              {
                key: 'print',
                header: 'Print Receipt',
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
        </div>
      )}

      {/* TAB 3: ACCOUNTING GENERAL LEDGER & CHANNEL BREAKDOWN */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(methodTotals).map(([method, total]) => (
              <div key={method} className="card p-5 space-y-2 border-surface-200">
                <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">{method}</div>
                <div className="text-2xl font-extrabold text-surface-900">{formatCurrency(total)}</div>
                <div className="text-xs text-surface-400">
                  {Math.round((total / (stats.totalCollected || 1)) * 100)}% of total collections
                </div>
              </div>
            ))}
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-900">Official Reconciliation Summary</h3>
                <p className="text-xs text-surface-500">Term 1 accounts balancing and revenue distribution</p>
              </div>
              <Badge variant="success">Books Balanced</Badge>
            </div>

            <div className="table-container bg-white">
              <table className="table">
                <thead>
                  <tr>
                    <th>Revenue Category</th>
                    <th>Billing Allocation</th>
                    <th>Collected (UGX)</th>
                    <th>Pending (UGX)</th>
                    <th>Recovery Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-surface-900">Tuition Fees (Day & Boarding)</td>
                    <td>Academic Instruction</td>
                    <td className="font-bold text-emerald-600">{formatCurrency(stats.totalCollected * 0.65)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(stats.outstandingFees * 0.65)}</td>
                    <td><Badge variant="success">68%</Badge></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-surface-900">School Development & Science Lab Levy</td>
                    <td>Infrastructure & Equipment</td>
                    <td className="font-bold text-emerald-600">{formatCurrency(stats.totalCollected * 0.15)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(stats.outstandingFees * 0.15)}</td>
                    <td><Badge variant="primary">72%</Badge></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-surface-900">Meals & Refreshment Program</td>
                    <td>Catering & Kitchen</td>
                    <td className="font-bold text-emerald-600">{formatCurrency(stats.totalCollected * 0.12)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(stats.outstandingFees * 0.12)}</td>
                    <td><Badge variant="primary">70%</Badge></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-surface-900">Uniforms, Kits & Badges</td>
                    <td>Student Attire</td>
                    <td className="font-bold text-emerald-600">{formatCurrency(stats.totalCollected * 0.08)}</td>
                    <td className="font-bold text-red-600">{formatCurrency(stats.outstandingFees * 0.08)}</td>
                    <td><Badge variant="success">90%</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEE STRUCTURE RATES */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-surface-900">Approved Fee Structures</h3>
              <p className="text-xs text-surface-500">Standard rates billed to students per term</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsFeeRateOpen(true)}
            >
              Add Fee Rate
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures.map(f => (
              <div key={f.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-surface-900">{f.name}</h4>
                    <span className="badge badge-surface capitalize text-[10px] mt-0.5">{f.fee_type}</span>
                  </div>
                  <Badge variant={f.is_mandatory ? 'primary' : 'surface'} className="text-[10px]">
                    {f.is_mandatory ? 'Compulsory' : 'Optional'}
                  </Badge>
                </div>
                <div className="text-2xl font-extrabold text-primary-700">
                  {formatCurrency(f.amount, f.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Receive Fee Payment"
        description="Issue official receipt from the Bursar & Accounts Department"
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
              <label className="label">Amount Received (UGX) *</label>
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
                  { value: 'Cash at Accounts Desk', label: 'Direct Cash (Accounts Desk)' },
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
        description="Generate term fee bill from the Bursar & Accounts Department"
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

          <div>
            <label className="label">Boarding / Accommodation (UGX)</label>
            <Input
              type="number"
              value={boardingAmount}
              onChange={e => setBoardingAmount(e.target.value)}
              placeholder="0 if day scholar"
            />
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

      {/* ADD FEE RATE MODAL */}
      <Modal
        isOpen={isFeeRateOpen}
        onClose={() => setIsFeeRateOpen(false)}
        title="Add Fee Structure Rate"
        description="Register a standard fee item into the rate card"
      >
        <form onSubmit={handleCreateFeeStructure} className="space-y-3">
          <div>
            <label className="label">Fee Category Name *</label>
            <Input
              required
              value={newFeeName}
              onChange={e => setNewFeeName(e.target.value)}
              placeholder="e.g. Science Laboratory Maintenance"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (UGX) *</label>
              <Input
                type="number"
                required
                value={newFeeAmount}
                onChange={e => setNewFeeAmount(e.target.value)}
                placeholder="e.g. 150000"
              />
            </div>
            <div>
              <label className="label">Fee Classification</label>
              <Select
                options={[
                  { value: 'tuition', label: 'Tuition' },
                  { value: 'boarding', label: 'Boarding' },
                  { value: 'meals', label: 'Meals' },
                  { value: 'uniform', label: 'Uniform' },
                  { value: 'exam', label: 'Examination' },
                  { value: 'other', label: 'Other / Levies' },
                ]}
                value={newFeeType}
                onChange={e => setNewFeeType(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsFeeRateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Fee Rate
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
          <div className="space-y-4 p-6 border-2 border-surface-300 rounded-2xl bg-white text-surface-900">
            <div className="text-center border-b border-surface-200 pb-3">
              <h2 className="text-lg font-extrabold tracking-tight uppercase">{institution?.name}</h2>
              <p className="text-xs text-surface-500 font-semibold">Bursar & Accounts Department</p>
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
              <span>Bursar Officer: {activeReceiptPayment.receipt?.issued_by || 'Grace Atuhaire'}</span>
              <span className="font-semibold text-primary-600">Generated by ZentraOS</span>
            </div>
          </div>
        )}
      </Modal>

      {/* STUDENT FEE STATEMENT / CLEARANCE MODAL */}
      <Modal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        title="Student Fee Account Statement"
        size="lg"
        footer={
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print Fee Clearance Statement
          </Button>
        }
      >
        {activeStatementInvoice && (
          <div className="space-y-4 p-6 border border-surface-200 rounded-2xl bg-white text-surface-900">
            <div className="flex items-start justify-between border-b border-surface-200 pb-4">
              <div>
                <h2 className="text-base font-extrabold uppercase">{institution?.name}</h2>
                <p className="text-xs text-surface-500 font-semibold">Bursar & Accounts Department</p>
                <p className="text-xs text-surface-500">Student Financial Ledger & Examination Clearance</p>
                <div className="text-xs font-semibold text-primary-700 mt-1">
                  {currentAcademicYear?.name} • {currentTerm?.name}
                </div>
              </div>
              <Badge variant={activeStatementInvoice.balance === 0 ? 'success' : 'danger'} className="text-xs px-3 py-1">
                {activeStatementInvoice.balance === 0 ? 'CLEARED FOR EXAMS' : 'FEES OUTSTANDING'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Student Name</span>
                <span className="font-bold text-surface-900">
                  {activeStatementInvoice.student?.first_name} {activeStatementInvoice.student?.last_name}
                </span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Admission Number</span>
                <span className="font-mono font-bold text-primary-700">
                  {activeStatementInvoice.student?.admission_number}
                </span>
              </div>
              <div className="p-3 bg-surface-50 rounded-xl">
                <span className="text-surface-400 block">Class</span>
                <span className="font-bold text-surface-900">
                  {activeStatementInvoice.student?.current_class?.name || 'Class'}
                </span>
              </div>
            </div>

            <div className="border border-surface-200 rounded-xl overflow-hidden">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Billed Fee Item</th>
                    <th className="text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStatementInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td className="text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-50 font-bold">
                    <td>Total Billed</td>
                    <td className="text-right">{formatCurrency(activeStatementInvoice.total_amount)}</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-700 font-bold">
                    <td>Total Paid to Date</td>
                    <td className="text-right">-{formatCurrency(activeStatementInvoice.total_paid)}</td>
                  </tr>
                  <tr className="bg-surface-100 font-extrabold text-sm">
                    <td>Remaining Balance Due</td>
                    <td className={`text-right ${activeStatementInvoice.balance === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(activeStatementInvoice.balance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs text-surface-500 border-t border-surface-200 pt-3 flex items-center justify-between">
              <span>Verified by Bursar & Accounts: Grace Atuhaire</span>
              <span>Official Stamp Required for Examination Hall Entry</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
