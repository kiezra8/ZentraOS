import { useState } from 'react'
import {
  Users, Plus, Search, Phone, Mail, MapPin, UserPlus, Trash2, Edit2,
  MessageSquare, GraduationCap, Award, ExternalLink
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { Parent } from '@/types'

export function ParentsListPage() {
  const { institution, currentTerm } = useInstitutionStore()
  const [parents, setParents] = useState(() => DataService.getParents(institution?.id))
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [occupation, setOccupation] = useState('')

  const filteredParents = parents.filter(p =>
    `${p.full_name} ${p.phone} ${p.email || ''} ${p.address || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  function handleCreateParent(e: React.FormEvent) {
    e.preventDefault()
    DataService.createParent({
      institution_id: institution?.id || 'inst-001',
      full_name: fullName,
      phone,
      email,
      address,
      occupation,
    })

    setParents(DataService.getParents(institution?.id))
    setIsCreateOpen(false)
    setFullName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setOccupation('')
    toast.success('Parent / Guardian profile registered!')
  }

  function handleSendChildReportWhatsApp(parent: any, childStudent: any) {
    const report = DataService.generateStudentReportCard(childStudent.id, currentTerm?.id)
    if (!report) return toast.error('Could not generate report for student')
    
    const message = DataService.generateWhatsAppReportText(report)
    const url = DataService.getWhatsAppShareUrl(parent.phone, message)
    window.open(url, '_blank')
    toast.success(`Opening WhatsApp for ${parent.full_name}...`)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Parents & Guardians Directory"
        subtitle="Manage family records, emergency telephone lines, automatically linked children, and instant WhatsApp report dispatches"
        action={
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Register Guardian
          </Button>
        }
      />

      <div className="card p-4">
        <Input
          placeholder="Search parents by name, telephone, email, child..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftAdornment={<Search className="w-4 h-4" />}
        />
      </div>

      <DataTable<any>
        data={filteredParents}
        columns={[
          {
            key: 'full_name',
            header: 'Guardian Name',
            render: (row) => (
              <div className="flex items-center gap-3">
                <Avatar
                  src={row.photo_url}
                  name={row.full_name}
                  size="sm"
                />
                <div>
                  <div className="font-bold text-surface-900 text-sm">{row.full_name}</div>
                  <div className="text-xs text-surface-400">{row.occupation || 'Parent / Guardian'}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'WhatsApp / Telephone',
            render: (row) => (
              <div className="flex items-center gap-1.5 font-mono text-primary-700 text-xs font-semibold">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{row.phone}</span>
              </div>
            ),
          },
          {
            key: 'children',
            header: 'Connected Children / Scholars',
            render: (row) => (
              <div className="space-y-1">
                {row.children && row.children.length > 0 ? (
                  row.children.map((c: any) => (
                    <div key={c.student_id} className="flex items-center gap-1.5 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="font-semibold text-surface-900">{c.student?.first_name} {c.student?.last_name}</span>
                      <span className="text-surface-400 text-[11px]">({c.student?.admission_number})</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-surface-400 italic">No connected students</span>
                )}
              </div>
            ),
          },
          {
            key: 'address',
            header: 'Residence',
            render: (row) => (
              <span className="text-xs text-surface-600">{row.address || 'Kampala, Uganda'}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Send Academic Report',
            className: 'text-right',
            render: (row) => {
              const primaryChild = row.children?.[0]?.student
              return (
                <div className="flex items-center justify-end gap-1">
                  {primaryChild ? (
                    <Button
                      size="sm"
                      variant="success"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => handleSendChildReportWhatsApp(row, primaryChild)}
                    >
                      WhatsApp Report
                    </Button>
                  ) : (
                    <span className="text-xs text-surface-400 italic">—</span>
                  )}
                </div>
              )
            },
          },
        ]}
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Guardian"
        description="Add a parent or emergency contact to the directory"
      >
        <form onSubmit={handleCreateParent} className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Eng. Patrick Kigozi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telephone Number *</label>
              <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 772 000000" />
            </div>
            <div>
              <label className="label">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@domain.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Occupation</label>
              <Input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g. Civil Engineer" />
            </div>
            <div>
              <label className="label">Residence</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Bukoto, Kampala" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Guardian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
