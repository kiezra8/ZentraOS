import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './app/router'
import { useAuthStore } from './store/auth.store'
import { useInstitutionStore } from './store/institution.store'
import { DEMO_AUTH_USERS, DEMO_ACADEMIC_YEARS, DEMO_TERMS } from './lib/mockData'

export function App() {
  const { user, setUser } = useAuthStore()
  const { institution, setInstitution, setCurrentAcademicYear, setCurrentTerm } = useInstitutionStore()

  // Auto-initialize demo workspace if first visit
  useEffect(() => {
    if (!user) {
      const defaultUser = DEMO_AUTH_USERS.admin
      setUser(defaultUser)
      setInstitution(defaultUser.institution)
      setCurrentAcademicYear(DEMO_ACADEMIC_YEARS[0])
      setCurrentTerm(DEMO_TERMS[0])
    }
  }, [user, setUser, setInstitution, setCurrentAcademicYear, setCurrentTerm])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '0.875rem',
            fontSize: '0.875rem',
            padding: '12px 16px',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

export default App
