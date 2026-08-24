import { useState } from 'react'
import { Shield, Search, Lock, User, Clock, Terminal } from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

export function AuditLogsPage() {
  const { institution } = useInstitutionStore()
  const [logs] = useState(() => DataService.getAuditLogs(institution?.id))
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter(l =>
    `${l.action} ${l.table_name} ${l.user_id} ${l.ip_address || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security & System Audit Trail"
        subtitle="Immutable ledger of admissions, fee payments, marks entries, and administrative alterations"
      />

      <div className="card p-4">
        <Input
          placeholder="Filter audit entries by action, table, IP address..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftAdornment={<Search className="w-4 h-4" />}
        />
      </div>

      <DataTable<AuditLog>
        data={filteredLogs}
        columns={[
          {
            key: 'action',
            header: 'Event Action',
            render: (row) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-surface-600">
                  <Shield className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-surface-900">{row.action}</div>
                  <div className="text-[11px] text-surface-400 font-mono">Entity: {row.table_name}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'user',
            header: 'User ID',
            render: (row) => (
              <span className="font-mono text-xs text-surface-700">{row.user_id}</span>
            ),
          },
          {
            key: 'ip_address',
            header: 'IP & Device Origin',
            render: (row) => (
              <span className="text-xs text-surface-600 font-mono">{row.ip_address || '127.0.0.1 (Local)'}</span>
            ),
          },
          {
            key: 'timestamp',
            header: 'Timestamp',
            render: (row) => (
              <span className="text-xs text-surface-500 font-mono">{formatDateTime(row.created_at)}</span>
            ),
          },
        ]}
      />
    </div>
  )
}
