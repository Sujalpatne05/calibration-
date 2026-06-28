import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import AppRoutes from './routes/AppRoutes'
import InstallPWA from './components/InstallPWA'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <InstallPWA />
      </BrowserRouter>
    </AuthProvider>
  )
}
