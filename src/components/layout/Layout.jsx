import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from '../ui/ThemeToggle'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Theme toggle — floats top-right, doesn't take header space */}
        <div className="absolute top-5 right-5 md:top-7 md:right-8 z-20">
          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className="flex-1 px-5 md:px-10 py-6 md:py-9 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
