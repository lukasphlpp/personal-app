'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError(result.error)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                            <LogIn className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Personal</h1>
                        <p className="text-secondary">Mitarbeiterverwaltung & Zeiterfassung</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="deine-email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Passwort
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Anmelden...' : 'Anmelden'}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-secondary">
                            Noch kein Account?{' '}
                            <a href="/register" className="text-primary hover:underline font-medium">
                                Jetzt registrieren
                            </a>
                        </p>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-400 text-center">
                        Demo: admin@personal.app / admin123
                    </p>
                </div>
            </div>
        </div>
    )
}
