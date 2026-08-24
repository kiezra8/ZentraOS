import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Institution, AcademicYear, Term } from '@/types'

interface InstitutionState {
  institution: Institution | null
  currentAcademicYear: AcademicYear | null
  currentTerm: Term | null
  setInstitution: (institution: Institution | null) => void
  setCurrentAcademicYear: (year: AcademicYear | null) => void
  setCurrentTerm: (term: Term | null) => void
  reset: () => void
}

export const useInstitutionStore = create<InstitutionState>()(
  persist(
    (set) => ({
      institution: null,
      currentAcademicYear: null,
      currentTerm: null,
      setInstitution: (institution) => set({ institution }),
      setCurrentAcademicYear: (currentAcademicYear) => set({ currentAcademicYear }),
      setCurrentTerm: (currentTerm) => set({ currentTerm }),
      reset: () => set({ institution: null, currentAcademicYear: null, currentTerm: null }),
    }),
    {
      name: 'zentraos-institution',
    }
  )
)
