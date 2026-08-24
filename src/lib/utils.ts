import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInYears } from 'date-fns'
import type { PaymentStatus, StudentStatus, AttendanceStatus, ConnectivityStatus } from '@/types'

// ---- Tailwind Merge ----------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- Date Formatting ---------------------
export function formatDate(date: string | Date | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function getAge(dateOfBirth: string | null | undefined): number {
  if (!dateOfBirth) return 0
  return differenceInYears(new Date(), parseISO(dateOfBirth))
}

// ---- Currency ----------------------------
export function formatCurrency(
  amount: number,
  currency = 'UGX',
  locale = 'en-UG'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

// ---- Status Badges -----------------------
export function getStudentStatusConfig(status: StudentStatus) {
  const configs: Record<StudentStatus, { label: string; className: string }> = {
    active:      { label: 'Active',      className: 'badge-success' },
    graduated:   { label: 'Graduated',   className: 'badge-primary' },
    transferred: { label: 'Transferred', className: 'badge-surface' },
    suspended:   { label: 'Suspended',   className: 'badge-warning' },
    withdrawn:   { label: 'Withdrawn',   className: 'badge-surface'  },
    deceased:    { label: 'Deceased',    className: 'badge-danger'   },
  }
  return configs[status] ?? { label: status, className: 'badge-surface' }
}

export function getPaymentStatusConfig(status: PaymentStatus) {
  const configs: Record<PaymentStatus, { label: string; className: string }> = {
    paid:        { label: 'Paid',         className: 'badge-success' },
    partial:     { label: 'Partial',      className: 'badge-warning' },
    outstanding: { label: 'Outstanding',  className: 'badge-danger'  },
    overdue:     { label: 'Overdue',      className: 'badge-danger'  },
  }
  return configs[status] ?? { label: status, className: 'badge-surface' }
}

export function getAttendanceStatusConfig(status: AttendanceStatus) {
  const configs: Record<AttendanceStatus, { label: string; className: string; dot: string }> = {
    present: { label: 'Present', className: 'badge-success', dot: 'bg-success-500' },
    absent:  { label: 'Absent',  className: 'badge-danger',  dot: 'bg-danger-500'  },
    late:    { label: 'Late',    className: 'badge-warning', dot: 'bg-warning-500' },
    excused: { label: 'Excused', className: 'badge-surface', dot: 'bg-surface-400' },
  }
  return configs[status] ?? { label: status, className: 'badge-surface', dot: 'bg-surface-400' }
}

export function getConnectivityConfig(status: ConnectivityStatus) {
  const configs: Record<ConnectivityStatus, { label: string; className: string }> = {
    online:        { label: 'Online',        className: 'connectivity-online'  },
    offline:       { label: 'Offline',       className: 'connectivity-offline' },
    syncing:       { label: 'Syncing...',    className: 'connectivity-syncing' },
    sync_complete: { label: 'Synced',        className: 'connectivity-online'  },
    sync_error:    { label: 'Sync Error',    className: 'connectivity-offline' },
  }
  return configs[status]
}

// ---- Grade Calculation -------------------
export function calculateGrade(
  marks: number,
  maxMarks: number,
  scales: { grade: string; min_score: number; max_score: number }[]
): string {
  const percentage = (marks / maxMarks) * 100
  const scale = scales.find(s => percentage >= s.min_score && percentage <= s.max_score)
  return scale?.grade ?? 'F'
}

export function calculatePercentage(obtained: number, max: number): number {
  if (max === 0) return 0
  return Math.round((obtained / max) * 100 * 10) / 10
}

// ---- String Helpers ----------------------
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function truncate(str: string, maxLength = 40): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function generateId(): string {
  return crypto.randomUUID()
}

// ---- Role Helpers -----------------------
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    school_admin: 'School Admin',
    head_teacher: 'Head Teacher',
    deputy_head:  'Deputy Head',
    registrar:    'Registrar',
    teacher:      'Teacher',
    bursar:       'Bursar',
    nurse:        'Nurse',
    librarian:    'Librarian',
    storekeeper:  'Storekeeper',
    parent:       'Parent',
    student:      'Student',
  }
  return labels[role] ?? role
}

// ---- Number Formatting ------------------
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-UG').format(n)
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ---- Admission Number Generator ---------
export function generateAdmissionNumber(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(4, '0')}`
}

// ---- Receipt Number ---------------------
export function generateReceiptNumber(sequence: number): string {
  const year = new Date().getFullYear()
  return `RCP-${year}-${String(sequence).padStart(5, '0')}`
}
