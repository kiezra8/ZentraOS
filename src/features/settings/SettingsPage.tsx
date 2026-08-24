import { useState } from 'react'
import {
  Building2, Sliders, Shield, CreditCard, Save, Sparkles, Check, CheckCircle2
} from 'lucide-react'
import { SectionHeader, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useInstitutionStore } from '@/store/institution.store'
import { useAuthStore } from '@/store/auth.store'
import { DataService } from '@/lib/dataService'
import { toast } from 'react-hot-toast'

export function SettingsPage() {
  const { institution, setInstitution } = useInstitutionStore()
  const { user } = useAuthStore()

  const [schoolName, setSchoolName] = useState(institution?.name || '')
  const [motto, setMotto] = useState(institution?.motto || '')
  const [phone, setPhone] = useState(institution?.phone || '')
  const [email, setEmail] = useState(institution?.email || '')
  const [address, setAddress] = useState(institution?.address || '')
  const [currency, setCurrency] = useState(institution?.settings.currency || 'UGX')

  // Feature toggles
  const [enableHealth, setEnableHealth] = useState(institution?.settings.enable_health_module ?? true)
  const [enableLibrary, setEnableLibrary] = useState(institution?.settings.enable_library ?? true)
  const [enableInventory, setEnableInventory] = useState(institution?.settings.enable_inventory ?? true)
  const [enableParentPortal, setEnableParentPortal] = useState(institution?.settings.enable_parent_portal ?? true)

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!institution) return

    const updated = DataService.updateInstitution(institution.id, {
      name: schoolName,
      motto,
      phone,
      email,
      address,
      settings: {
        ...institution.settings,
        currency,
        enable_health_module: enableHealth,
        enable_library: enableLibrary,
        enable_inventory: enableInventory,
        enable_parent_portal: enableParentPortal,
      },
    })

    if (updated) {
      setInstitution(updated)
      toast.success('Institution settings updated!')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Institution Settings"
        subtitle="Configure school identity, operational modules, currency standards, and subscription"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Profile Form */}
        <div className="card lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">Institution Profile</h2>
            <p className="text-xs text-surface-500">Legal branding appearing on official transcripts, receipts, and invoices</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="label">Institution Name</label>
              <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            </div>

            <div>
              <label className="label">Motto / Slogan</label>
              <Input value={motto} onChange={e => setMotto(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contact Telephone</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Official Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Physical Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Default Currency</label>
                <Select
                  options={[
                    { value: 'UGX', label: 'UGX — Ugandan Shilling' },
                    { value: 'KES', label: 'KES — Kenyan Shilling' },
                    { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
                    { value: 'USD', label: 'USD — US Dollar' },
                  ]}
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Institution Code</label>
                <Input disabled value={institution?.code || 'SCH-001'} className="bg-surface-100 font-mono" />
              </div>
            </div>

            <div className="pt-2 border-t border-surface-100 flex justify-end">
              <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                Save Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Subscription & Module Toggles */}
        <div className="space-y-6">
          {/* Subscription Plan Card */}
          <div className="card space-y-3 bg-gradient-to-br from-surface-900 to-indigo-950 text-white border-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-300">Subscription</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="text-2xl font-bold capitalize">{institution?.subscription_plan || 'Professional'} Plan</div>
            <p className="text-xs text-surface-300">
              Unlimited students, automated SMS/receipts, multi-user role permissions enabled.
            </p>
            <div className="pt-2 border-t border-surface-700/60 flex items-center justify-between text-xs">
              <span className="text-surface-400">Next Billing Cycle</span>
              <span className="font-semibold text-white">December 2026</span>
            </div>
          </div>

          {/* Module Toggles */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-surface-900">Configured Modules</h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-surface-50">
                <span className="font-medium text-surface-800">Health & Medical Module</span>
                <input
                  type="checkbox"
                  checked={enableHealth}
                  onChange={e => setEnableHealth(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-surface-50">
                <span className="font-medium text-surface-800">Library & Book Loans</span>
                <input
                  type="checkbox"
                  checked={enableLibrary}
                  onChange={e => setEnableLibrary(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-surface-50">
                <span className="font-medium text-surface-800">Parent / Guardian Portal</span>
                <input
                  type="checkbox"
                  checked={enableParentPortal}
                  onChange={e => setEnableParentPortal(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-surface-50">
                <span className="font-medium text-surface-800">Store & Inventory</span>
                <input
                  type="checkbox"
                  checked={enableInventory}
                  onChange={e => setEnableInventory(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
