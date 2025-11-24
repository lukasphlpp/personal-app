'use client'

import { useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'

const Header = () => {
    const { data: session } = useSession()
    const user = session?.user

    // Initials generator
    const getInitials = () => {
        if (!user?.firstName || !user?.lastName) return 'U'
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }

    return (
        <header className="h-16 bg-surface/50 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-10 ml-64">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs could go here later */}
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Suchen..."
                        className="bg-slate-900/50 border border-slate-700 text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500 text-white"
                    />
                </div>

                <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
                    <button className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700/50">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-surface"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">
                                {user?.role?.toLowerCase() || 'Mitarbeiter'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-surface">
                            {getInitials()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
