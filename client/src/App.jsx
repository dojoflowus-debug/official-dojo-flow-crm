import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'

// Pages
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import StudentsNew from './pages/StudentsNew'
import Leads from './pages/Leads'
import Classes from './pages/Classes'
// Attendance merged into KioskManagement
import Billing from './pages/Billing'
import Reports from './pages/Reports'
import SetupWizard from './pages/SetupWizard'
import Kiosk from './pages/Kiosk'
import KioskCheckIn from './pages/KioskCheckIn'
import KaiAssistant from './components/KaiAssistant'
import KaiDashboard from './pages/KaiDashboard'
import CRMDashboard from './pages/CRMDashboard'
import VirtualReceptionist from './pages/VirtualReceptionist'
import Staff from './pages/Staff'
import Marketing from './pages/Marketing'
import InstructorView from './pages/InstructorView'
import SubscriptionDashboard from './pages/SubscriptionDashboard'
import Pricing from './pages/Pricing'
import PaymentSuccess from './pages/PaymentSuccess'
import Themes from './pages/Themes'
import Campaigns from './pages/Campaigns'
import Automation from './pages/Automation'
import Conversations from './pages/Conversations'

function AppContent({ isAuthenticated, handleLogin, handleLogout, theme, toggleTheme }) {
  const navigate = useNavigate()

  const handleKaiCommand = (command) => {
    console.log('Kai command:', command)
    
    if (command.function === 'navigate') {
      const page = command.args.page
      navigate(`/${page}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/kai-dashboard"
          element={
            isAuthenticated ? (
              <KaiDashboard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/crm-dashboard"
          element={
            isAuthenticated ? (
              <CRMDashboard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/students"
          element={
            isAuthenticated ? (
              <StudentsNew onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/leads"
          element={
            isAuthenticated ? (
              <Leads onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/receptionist"
          element={
            isAuthenticated ? (
              <VirtualReceptionist onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/test-page"
          element={
            isAuthenticated ? (
              <VirtualReceptionist onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/classes"
          element={
            isAuthenticated ? (
              <Classes onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/instructor-view/:classId"
          element={
            isAuthenticated ? (
              <InstructorView />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/kiosk"
          element={
            isAuthenticated ? (
              <Kiosk onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/attendance"
          element={<Navigate to="/kiosk-management" replace />}
        />
        <Route
          path="/staff"
          element={
            isAuthenticated ? (
              <Staff onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/billing"
          element={
            isAuthenticated ? (
              <Billing onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <Reports onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/marketing"
          element={
            isAuthenticated ? (
              <Marketing onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/setup"
          element={
            isAuthenticated ? (
              <SetupWizard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/kiosk-checkin"
          element={<KioskCheckIn />}
        />
        <Route
          path="/subscription"
          element={
            isAuthenticated ? (
              <SubscriptionDashboard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/themes"
          element={
            isAuthenticated ? (
              <Themes onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/pricing"
          element={
            isAuthenticated ? (
              <Pricing onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/subscription/success"
          element={
            isAuthenticated ? (
              <PaymentSuccess />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/campaigns"
          element={
            isAuthenticated ? (
              <Campaigns onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/automation"
          element={
            isAuthenticated ? (
              <Automation onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/conversations"
          element={
            isAuthenticated ? (
              <Conversations onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      {isAuthenticated && <KaiAssistant onCommand={handleKaiCommand} />}
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Temporarily bypassed for testing
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    // Check if user is already logged in
    const auth = localStorage.getItem('dojoflow_auth')
    if (auth) {
      setIsAuthenticated(true)
    }

    // Check theme preference
    const savedTheme = localStorage.getItem('dojoflow_theme') || 'dark'
    setTheme(savedTheme)
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const handleLogin = (credentials) => {
    // Demo login - accept demo@dojoflow.com or sensei30002003@gmail.com
    if (
      (credentials.email === 'demo@dojoflow.com' || credentials.email === 'sensei30002003@gmail.com') &&
      credentials.password === 'demo123' &&
      credentials.orgId === 'demo-dojo'
    ) {
      localStorage.setItem('dojoflow_auth', JSON.stringify(credentials))
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('dojoflow_auth')
    setIsAuthenticated(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('dojoflow_theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <Router>
      <AppContent 
        isAuthenticated={isAuthenticated}
        handleLogin={handleLogin}
        handleLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme}
      />
    </Router>
  )
}

export default App

