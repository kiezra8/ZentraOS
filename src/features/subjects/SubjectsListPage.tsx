import { useState } from 'react'
import { BookOpen, Plus, Search, Tag, CheckCircle2 } from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { useInstitutionStore } from '@/store/institution.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'
import type { Subject } from '@/types'

export function SubjectsListPage() {
  const { institution } = useInstitutionStore()
  const [subjects, setSubjects] = useState(() => DataService.getSubjects(institution?.id))
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<'theory' | 'practical' | 'clinical'>('theory')
  const [isElective, setIsElective] = useState(false)

  function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault()
    DataService.createSubject({
      institution_id: institution?.id || 'inst-001',
      name,
      code,
      type,
      is_elective: isElective,
    })

    setSubjects(DataService.getSubjects(institution?.id))
    setIsCreateOpen(false)
    setName('')
    setCode('')
    toast.success('Subject added to curriculum!')
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Subjects & Curriculum"
        subtitle="Manage academic subjects, UNEB paper codes, practical laboratory courses, and clinical modules"
        action={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Add Subject
          </Button>
        }
      />

      <DataTable<Subject>
        data={subjects}
        columns={[
          {
            key: 'code',
            header: 'Subject Code',
            render: (row) => (
              <span className="font-mono font-bold text-xs text-primary-700">
                {row.code || 'GEN'}
              </span>
            ),
          },
          {
            key: 'name',
            header: 'Subject Name',
            render: (row) => (
              <div className="font-semibold text-surface-900">{row.name}</div>
            ),
          },
          {
            key: 'type',
            header: 'Course Type',
            render: (row) => (
              <Badge variant={row.type === 'practical' ? 'warning' : row.type === 'clinical' ? 'purple' : 'surface'} className="capitalize text-xs">
                {row.type}
              </Badge>
            ),
          },
          {
            key: 'elective',
            header: 'Classification',
            render: (row) => (
              <span className="text-xs text-surface-600">
                {row.is_elective ? 'Elective / Optional' : 'Compulsory Core'}
              </span>
            ),
          },
        ]}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Subject to Curriculum"
        description="Configure a new subject or training module"
      >
        <form onSubmit={handleCreateSubject} className="space-y-3">
          <div>
            <label className="label">Subject Name *</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chemistry (Organic & Physical)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject Code *</label>
              <Input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CHM101" />
            </div>
            <div>
              <label className="label">Course Type</label>
              <Select
                options={[
                  { value: 'theory', label: 'Theory / Lecture' },
                  { value: 'practical', label: 'Practical Laboratory' },
                  { value: 'clinical', label: 'Clinical Rotation' },
                ]}
                value={type}
                onChange={e => setType(e.target.value as any)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
