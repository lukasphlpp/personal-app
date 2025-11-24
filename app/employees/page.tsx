'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Mail, Clock, Calendar as CalendarIcon, TrendingUp, TrendingDown, Edit2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    email: string | null
    role: string
    weeklyHours: number
    overtimeBalance: number
    color: string
    startDate: string
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        role: 'EMPLOYEE',
        weeklyHours: 40,
        startDate: new Date().toISOString().split('T')[0]
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (editingEmployee) {
            setFormData({
                employeeId: editingEmployee.employeeId,
                firstName: editingEmployee.firstName,
                lastName: editingEmployee.lastName,
                email: editingEmployee.email || '',
                role: editingEmployee.role,
                weeklyHours: editingEmployee.weeklyHours,
                startDate: new Date(editingEmployee.startDate).toISOString().split('T')[0]
            })
            setIsModalOpen(true)
        }
    }, [editingEmployee])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const url = '/api/employees'
            const method = editingEmployee ? 'PATCH' : 'POST'
            const body = editingEmployee
                ? { ...formData, id: editingEmployee.id }
                : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setIsModalOpen(false)
                setEditingEmployee(null)
                fetchEmployees()
                resetForm()
            } else {
                const data = await res.json()
                alert(data.error || 'Fehler beim Speichern')
            }
        } catch (error) {
            console.error('Failed to save employee', error)
            alert('Fehler beim Speichern')
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({
            employeeId: '',
            firstName: '',
            lastName: '',
            email: '',
            role: 'EMPLOYEE',
            weeklyHours: 40,
            startDate: new Date().toISOString().split('T')[0]
        })
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingEmployee(null)
        resetForm()
    }

    const filteredEmployees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Helper functions
    const getOvertimeColor = (balance: number) => {
        if (balance < 0) return 'text-red-400'
        if (balance === 0) return 'text-slate-400'
        return 'text-green-400'
    }

    const getOvertimeBgColor = (balance: number) => {
        if (balance < 0) return 'bg-red-500/10 border-red-500/20'
        if (balance === 0) return 'bg-slate-700/50 border-slate-600'
        return 'bg-green-500/10 border-green-500/20'
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Mitarbeiter</h1>
                        <p className="text-secondary">Verwalte dein Team und Arbeitszeitkonten</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/employees/payroll"
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            Lohnbuchhaltung
                        </Link>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Mitarbeiter hinzufügen
                        </button>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-surface border border-slate-700 rounded-xl p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Suchen nach Name, Email oder Personalnummer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Personalnr.</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mitarbeiter</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rolle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Soll-Std/Woche</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Arbeitsstundenkonto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Startdatum</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Laden...</td>
                                    </tr>
                                ) : filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Keine Mitarbeiter gefunden</td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-300">{employee.employeeId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                                                        style={{ backgroundColor: employee.color }}
                                                    >
                                                        {employee.firstName[0]}{employee.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{employee.firstName} {employee.lastName}</p>
                                                        {employee.email && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <Mail size={12} />
                                                                {employee.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${employee.role === 'ADMIN'
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : employee.role === 'MANAGER'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-slate-700/50 text-slate-300 border-slate-600'
                                                    }`}>
                                                    {employee.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Clock size={14} className="text-slate-500" />
                                                    {employee.weeklyHours}h
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${getOvertimeBgColor(employee.overtimeBalance)}`}>
                                                        {employee.overtimeBalance < 0 ? (
                                                            <TrendingDown size={14} className="text-red-400" />
                                                        ) : employee.overtimeBalance > 0 ? (
                                                            <TrendingUp size={14} className="text-green-400" />
                                                        ) : null}
                                                        <span className={getOvertimeColor(employee.overtimeBalance)}>
                                                            {employee.overtimeBalance > 0 ? '+' : ''}{employee.overtimeBalance.toFixed(1)}h
                                                        </span>
                                                    </span>
                                                    {employee.overtimeBalance <= -18 && (
                                                        <span className="text-xs text-red-400">⚠️</span>
                                                    )}
                                                    {employee.overtimeBalance >= 38 && (
                                                        <span className="text-xs text-amber-400">⚠️</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <CalendarIcon size={14} className="text-slate-500" />
                                                    {new Date(employee.startDate).toLocaleDateString('de-DE')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setEditingEmployee(employee)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-700/50 rounded-lg transition-colors"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Employee Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Personalnummer <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            placeholder="z.B. MA001"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Vorname <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Nachname <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Email <span className="text-slate-500 text-xs">(optional, nur für Login)</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="optional"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Rolle</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="EMPLOYEE">Mitarbeiter</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Soll-Stunden/Woche</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="60"
                                value={formData.weeklyHours}
                                onChange={e => setFormData({ ...formData, weeklyHours: parseFloat(e.target.value) })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Startdatum</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {submitting ? 'Speichern...' : editingEmployee ? 'Aktualisieren' : 'Mitarbeiter anlegen'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    )
}
