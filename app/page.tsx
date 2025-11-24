export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-white">
                    Time Tracking Web App
                </h1>
                <p className="text-xl text-secondary">
                    Moderne Zeiterfassung und Mitarbeiterverwaltung
                </p>
                <div className="flex gap-4 justify-center mt-8">
                    <div className="bg-surface border border-slate-700 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-primary mb-2">✅ Next.js Setup</h2>
                        <p className="text-sm text-slate-400">React 18 + TypeScript</p>
                    </div>
                    <div className="bg-surface border border-slate-700 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-primary mb-2">🎨 TailwindCSS</h2>
                        <p className="text-sm text-slate-400">Dark Mode Design</p>
                    </div>
                    <div className="bg-surface border border-slate-700 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-primary mb-2">🗄️ Prisma</h2>
                        <p className="text-sm text-slate-400">Database ORM</p>
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-8">
                    Installiere Dependencies mit: <code className="bg-slate-800 px-2 py-1 rounded">npm install</code>
                </p>
            </div>
        </main>
    )
}
