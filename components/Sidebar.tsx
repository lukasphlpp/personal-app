'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Home, Users, Calendar, BarChart3, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sidebar = () => {
    const pathname = usePathname()

    const menuItems = [
        { id: 'dashboard', href: '/dashboard', icon: Home, label: 'Dashboard' },
        { id: 'employees', href: '/employees', icon: Users, label: 'Mitarbeiter' },
        { id: 'calendar', href: '/calendar', icon: Calendar, label: 'Kalender' },
        { id: 'reports', href: '/reports', icon: BarChart3, label: 'Berichte' },
        { id: 'settings', href: '/settings', icon: Settings, label: 'Einstellungen' }
    ]

    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true
        if (href !== '/dashboard' && pathname.startsWith(href)) return true
        return false
    }

    return (
        <aside className="w-64 bg-surface border-r border-slate-700 flex flex-col h-full fixed left-0 top-0 bottom-0 z-20 transition-all duration-300">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-slate-700">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Personal</span>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                            isActive(item.href)
                                ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                                : "text-secondary hover:bg-slate-700/50 hover:text-white"
                        )}
                    >
                        <item.icon size={20} className={isActive(item.href) ? 'text-primary' : 'text-slate-400 group-hover:text-white'} />
                        <span className="font-medium">{item.label}</span>
                        {isActive(item.href) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-rose-500/10 hover:text-rose-500 transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Abmelden</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
