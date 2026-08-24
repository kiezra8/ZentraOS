import { useState } from 'react'
import {
  Bell, Plus, Send, Users, Sparkles, Pin, CheckCircle2, Megaphone
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useInstitutionStore } from '@/store/institution.store'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  content: string
  target: 'all' | 'parents' | 'teachers' | 'students'
  author: string
  date: string
  isPinned: boolean
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Term 1 Midterm Assessment & Visitation Day Schedule',
    content: 'Please be informed that Midterm exams will conclude on March 25th, followed by the Parent-Teacher Visitation Day on Saturday, March 28th, starting at 9:00 AM in the Main School Quadrangle.',
    target: 'parents',
    author: 'Dr. Joseph Muwanga (Head Teacher)',
    date: '2026-03-10',
    isPinned: true,
  },
  {
    id: 'ann-2',
    title: 'UNEB Registration Verification for S.4 & S.6 Candidates',
    content: 'All candidate students and their subject teachers must verify their index numbers, date of birth, and registered combinations with the Academic Registrar before Friday.',
    target: 'all',
    author: 'Academic Registrar Desk',
    date: '2026-03-05',
    isPinned: true,
  },
  {
    id: 'ann-3',
    title: 'Inter-House Sports & Athletics Gala 2026',
    content: 'House captains are requested to submit team rosters for 100m, 400m, high jump, and football relays to the Sports Master by tomorrow afternoon.',
    target: 'students',
    author: 'Sports Department',
    date: '2026-03-02',
    isPinned: false,
  },
]

export function AnnouncementsPage() {
  const { institution } = useInstitutionStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<'all' | 'parents' | 'teachers' | 'students'>('all')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      target,
      author: 'School Administration',
      date: new Date().toISOString().split('T')[0],
      isPinned: false,
    }

    setAnnouncements([newAnn, ...announcements])
    setIsCreateOpen(false)
    setTitle('')
    setContent('')
    toast.success('Announcement broadcasted to portal!')
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Announcements & Circulars"
        subtitle="Broadcast school notices, parent newsletters, exam circulars, and event bulletins"
        action={
          <Button
            variant="primary"
            leftIcon={<Megaphone className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Post Announcement
          </Button>
        }
      />

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="card p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ann.isPinned && (
                  <span className="badge badge-warning text-[10px] flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                <Badge variant="primary" className="capitalize text-xs">
                  Target: {ann.target}
                </Badge>
                <span className="text-xs text-surface-400">• {formatDate(ann.date)}</span>
              </div>
              <span className="text-xs font-medium text-surface-600">By: {ann.author}</span>
            </div>

            <h3 className="text-lg font-bold text-surface-900">{ann.title}</h3>
            <p className="text-sm text-surface-600 leading-relaxed">{ann.content}</p>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post School Announcement"
        description="Publish circular notice across role portals"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Announcement Title *</label>
            <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Term Circular & Fee Instructions" />
          </div>

          <div>
            <label className="label">Target Audience</label>
            <Select
              options={[
                { value: 'all', label: 'All School Community (Whole School)' },
                { value: 'parents', label: 'Parents & Guardians Portal' },
                { value: 'teachers', label: 'Teachers & Academic Staff' },
                { value: 'students', label: 'Students Only' },
              ]}
              value={target}
              onChange={e => setTarget(e.target.value as any)}
            />
          </div>

          <div>
            <label className="label">Circular Body / Content *</label>
            <Textarea required value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Type announcement text..." />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Broadcast Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
