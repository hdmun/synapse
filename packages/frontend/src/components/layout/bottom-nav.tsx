import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, DollarSign,
  FolderOpen, Activity, Moon, Sun,
} from 'lucide-react'
import { useTheme } from '../theme-provider'
import { cn } from '../../lib/utils'

const NAV = [
  { href: '/',         label: 'Overview',  icon: LayoutDashboard },
  { href: '/projects', label: 'Projects',  icon: FolderOpen      },
  { href: '/sessions', label: 'Sessions',  icon: MessageSquare   },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex text-slate-200">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            to={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors',
              active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        )
      })}
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors text-slate-500 hover:text-slate-300 cursor-pointer"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}   
        <span className="text-[10px] font-medium leading-none">Theme</span>
      </button>
    </nav>
  )
}