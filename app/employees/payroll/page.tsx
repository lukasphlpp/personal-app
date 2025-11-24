'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    weeklyHours: number
    overtimeBalance: number
    color: string
}

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [hourlyRate] = useState(15) // Default hourly rate, can be made configurable

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees')
            const data = await res.json()
            setEmployees(data)
        } catch (error) {
            console.error('Failed to fetch employees', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate total hours worked (simplified - would need actual time entries)
    const calculateTotalHours = (weeklyHours: number) => {
        // Assuming 4 weeks per month
        return weeklyHours * 4
    }

    const calculateSalary = (weeklyHours: number) => {
        const totalHours = calculateTotalHours(weeklyHours)
        return (totalHours * hourlyRate).toFixed(2)
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Vorbereitende Lohnbuchhaltung</h1>
                        <p className="text-secondary">Übersicht über Mitarbeiter und Arbeitsstunden</p>
                    </div>
                    <Link
                        href="/employees"
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                        ← Zurück zur Mitarbeiterverwaltung
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-primary" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Mitarbeitende Person</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{employees.length}</p>
                    </div>

                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-blue-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Gesamt Wochenstunden</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {employees.reduce((sum, emp) => sum + emp.weeklyHours, 0)} Stunden
                        </p>
                    </div>

                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-green-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Durchschn. Stundensatz</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{hourlyRate},00 €</p>
                    </div>
                </div>

                {/* Employee List */}
                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Mitarbeitende Person</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Laden...</div>
                    ) : (
                        <div className="divide-y divide-slate-700">
                            {employees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="p-6 hover:bg-slate-800/30 transition-colors flex items-center justify-between"
                                >
                                    {/* Employee Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                                            style={{ backgroundColor: employee.color }}
                                        >
                                            {employee.firstName[0]}{employee.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {employee.firstName} {employee.lastName}
                                            </p>
                                            <p className="text-sm text-slate-400">ID: {employee.employeeId}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-8 flex-1">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400 mb-1">Stundensatz</p>
                                            <p className="text-lg font-semibold text-white">{hourlyRate},00 €</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-slate-400 mb-1">Wochenstunden</p>
                                            <p className="text-lg font-semibold text-white">{employee.weeklyHours} Stunden</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-slate-400 mb-1">Stunden gesamt (Monat)</p>
                                            <p className="text-lg font-semibold text-white">
                                                {calculateTotalHours(employee.weeklyHours)} Stunden
                                            </p>
                                        </div>
                                    </div>

                                    {/* Salary */}
                                    <div className="text-right ml-8">
                                        <p className="text-xs text-slate-400 mb-1">Geschätztes Gehalt</p>
                                        <p className="text-xl font-bold text-primary">
                                            {calculateSalary(employee.weeklyHours)} €
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
