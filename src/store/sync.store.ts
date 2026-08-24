import { create } from 'zustand'
import type { ConnectivityStatus } from '@/types'

interface SyncState {
  status: ConnectivityStatus
  pendingCount: number
  lastSyncAt: string | null
  setStatus: (status: ConnectivityStatus) => void
  setPendingCount: (count: number) => void
  setLastSyncAt: (at: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: navigator.onLine ? 'online' : 'offline',
  pendingCount: 0,
  lastSyncAt: null,
  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}))
