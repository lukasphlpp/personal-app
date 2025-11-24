'use client'

import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full ml-64 transition-all duration-300">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    )
}
