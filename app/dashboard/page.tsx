'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center text-white">Laden...</div>
    }

    return (
        <AppLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-secondary">Willkommen zurück, {session?.user?.firstName}! 👋</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <p className="text-2xl font-bold text-white">Aktiv</p>
                    </div>
                </div>

                <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Deine Rolle</h3>
                    <p className="text-2xl font-bold text-primary">{session?.user?.role}</p>
                </div>

                <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">User ID</h3>
                    <p className="text-lg font-mono text-slate-300 truncate" title={session?.user?.id}>
                        {session?.user?.id?.substring(0, 8)}...
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}
