import { useSidebar } from './sidebar-context'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Menu } from 'lucide-react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, setMobileOpen } = useSidebar()
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      <Sidebar />
      <BottomNav />
      
      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <span className="font-bold text-slate-100 tracking-tight">Synapse</span>
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-200"
        >
          <Menu size={20} />
        </button>
      </header>

      <main
        className={[
          'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden',
          'transition-[margin] duration-300',
          collapsed ? 'md:ml-14' : 'md:ml-56',
          'pb-[60px] md:pb-0' // padding for mobile bottom nav
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  )
}