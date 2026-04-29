import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, MessageSquare, DollarSign,
  Wrench, Activity, History, CheckSquare, FileText,
  Brain, Settings, Download, Moon, Sun, PanelLeftClose, PanelLeft,
} from 'lucide-react'
import { useTheme } from '../theme-provider'
import { useSidebar } from './sidebar-context'
import { cn } from '../../lib/utils'

const NAV = [
  { href: '/',         label: 'Overview',  icon: LayoutDashboard },
  { href: '/projects', label: 'Projects',  icon: FolderOpen      },
  { href: '/sessions', label: 'Sessions',  icon: MessageSquare   },
  // Adding placeholder routes to match original Sidebar, they can be implemented later
  { href: '/settings', label: 'Settings',  icon: Settings        },
]

function NavItem({
  href, label, icon: Icon, active, collapsed,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; collapsed: boolean
}) {
  const link = (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors relative',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
        active
          ? 'text-indigo-400 bg-slate-800 border-l-2 border-l-indigo-400'  
          : 'text-slate-500 hover:text-indigo-300 hover:bg-slate-800/80',
        active && collapsed && 'border-l-0',
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-400' : 'text-slate-500/60')} />
      {!collapsed && label}
    </Link>
  )

  return link;
}

function SidebarContents({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()
  const { toggle: toggleCollapsed } = useSidebar()

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Header */}
      <div className={cn(
        'border-b border-slate-800 flex items-center',
        collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 pt-5 pb-4',        
      )}>
        {!collapsed && (
          <span className="font-bold text-slate-100 tracking-tight text-lg">
            Synapse
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {collapsed
            ? <PanelLeft className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-4 space-y-0.5 overflow-y-auto', collapsed ? 'px-1' : 'px-3')}>
        {NAV.map(({ href, label, icon }) => (
          <div key={href} onClick={onNavigate}>
            <NavItem
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || (href !== '/' && pathname.startsWith(href))}
              collapsed={collapsed}
            />
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-slate-800 flex items-center',
        collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3',
      )}>
        {!collapsed && (
          <span className="text-xs text-slate-500">
           Synapse UI
          </span>
        )}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 h-screen flex-col z-40',
          'transition-[width] duration-300 overflow-hidden',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        <SidebarContents collapsed={collapsed} />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-300 ease-in-out md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
         <SidebarContents onNavigate={() => setMobileOpen(false)} />
      </div>
    </>
  )
}