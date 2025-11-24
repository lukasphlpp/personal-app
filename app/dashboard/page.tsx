'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
            <div className="bg-surface border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Willkommen zurück, {session?.user?.firstName}! 👋</h2>
                <p className="text-secondary mb-4">Du bist eingeloggt als: <span className="text-primary font-mono">{session?.user?.role}</span></p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Status</h3>
                        <p className="text-green-400 font-bold">Aktiv</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Email</h3>
                        <p className="text-white">{session?.user?.email}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">User ID</h3>
                        <p className="text-slate-500 text-xs font-mono truncate">{session?.user?.id}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
