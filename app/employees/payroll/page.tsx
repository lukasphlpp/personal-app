'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Clock, TrendingUp, Users, Edit2, Check, X } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    weeklyHours: number
    hourlyRate: number
    overtimeBalance: number
    color: string
}

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRate, setEditRate] = useState(0)

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

    const startEdit = (employee: Employee) => {
        setEditingId(employee.id)
        setEditRate(employee.hourlyRate)
    }

    const saveEdit = async () => {
        if (!editingId) return

        try {
            const res = await fetch('/api/employees', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    hourlyRate: editRate
                })
            })

            if (res.ok) {
                setEditingId(null)
                fetchEmployees()
            }
        } catch (error) {
            console.error('Failed to update hourly rate', error)
        }
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditRate(0)
    }

    // Calculate total hours worked (simplified - would need actual time entries)
    const calculateMonthlyHours = (weeklyHours: number) => {
        // Assuming 4.33 weeks per month (52 weeks / 12 months)
        return weeklyHours * 4.33
    }

    const calculateMonthlySalary = (weeklyHours: number, hourlyRate: number) => {
        const totalHours = calculateMonthlyHours(weeklyHours)
        return totalHours * hourlyRate
    }

    const totalMonthlyCost = employees.reduce((sum, emp) =>
        sum + calculateMonthlySalary(emp.weeklyHours, emp.hourlyRate), 0
    )

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Vorbereitende Lohnbuchhaltung</h1>
                        <p className="text-secondary">Übersicht über Mitarbeiter und Lohnkosten</p>
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
                            <h3 className="text-slate-400 text-sm font-medium">Mitarbeitende Personen</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{employees.length}</p>
                    </div>

                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-blue-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Gesamt Wochenstunden</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {employees.reduce((sum, emp) => sum + emp.weeklyHours, 0).toFixed(1)} h
                        </p>
                    </div>

                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-green-400" size={24} />
                            <h3 className="text-slate-400 text-sm font-medium">Monatliche Gesamtlohnkosten</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-400">
                            {totalMonthlyCost.toFixed(2)} €
                        </p>
                    </div>
                </div>

                {/* Employee List */}
                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Mitarbeitende Personen</h2>
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
                                            {editingId === employee.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={editRate}
                                                        onChange={(e) => setEditRate(parseFloat(e.target.value))}
                                                        className="w-20 bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white text-center"
                                                    />
                                                    <span className="text-white">€</span>
                                                    <button
                                                        onClick={saveEdit}
                                                        className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <p className="text-lg font-semibold text-white">{employee.hourlyRate.toFixed(2)} €</p>
                                                    <button
                                                        onClick={() => startEdit(employee)}
                                                        className="p-1 text-slate-400 hover:text-primary"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-slate-400 mb-1">Wochenstunden</p>
                                            <p className="text-lg font-semibold text-white">{employee.weeklyHours} h</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-slate-400 mb-1">Monatsstunden</p>
                                            <p className="text-lg font-semibold text-white">
                                                {calculateMonthlyHours(employee.weeklyHours).toFixed(1)} h
                                            </p>
                                        </div>
                                    </div>

                                    {/* Salary */}
                                    <div className="text-right ml-8">
                                        <p className="text-xs text-slate-400 mb-1">Monatliches Gehalt</p>
                                        <p className="text-xl font-bold text-primary">
                                            {calculateMonthlySalary(employee.weeklyHours, employee.hourlyRate).toFixed(2)} €
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
