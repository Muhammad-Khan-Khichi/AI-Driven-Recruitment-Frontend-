import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../src/pages/context/ThemeContext'
import { AuthProvider } from '../src/pages/context/AuthContext'
import { ResumeProvider } from '../src/pages/context/ResumeContext'
import AppRouter from './Router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ResumeProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ResumeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
