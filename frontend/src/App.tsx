import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import BoardPage from './pages/BoardPage'
import BacklogPage from './pages/BacklogPage'
import TeamsPage from './pages/TeamsPage'
import MainLayout from './components/MainLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, validateSession } = useAuthStore()
  const navigate = useNavigate()
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        const valid = await validateSession()
        if (!valid) {
          navigate('/login')
        }
      }
      setValidating(false)
    }
    checkSession()
  }, [])

  if (validating && isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectKey/board" element={<BoardPage />} />
        <Route path="projects/:projectKey/backlog" element={<BacklogPage />} />
        <Route path="teams" element={<TeamsPage />} />
      </Route>
    </Routes>
  )
}

export default App
