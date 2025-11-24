'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    weeklyHours: number
    overtimeBalance: number
    color: string
}

interface TimeEntry {
    id: string
    userId: string
    date: string
    type: 'work' | 'vacation' | 'sick' | 'holiday'
    hours: number | null
    note: string | null
}

export default function CalendarPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        type: 'work' as 'work' | 'vacation' | 'sick' | 'holiday',
        hours: 8,
        note: ''
    })

    useEffect(() => {
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (selectedEmployee) {
            fetchTimeEntries()
        }
    }, [selectedEmployee, currentDate])

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees')
            const data = await res.json()
            setEmployees(data)
            if (data.length > 0) {
                setSelectedEmployee(data[0])
            }
        } catch (error) {
            console.error('Failed to fetch employees', error)
        }
    }

    const fetchTimeEntries = async () => {
        if (!selectedEmployee) return

        setLoading(true)
        try {
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth()
            const startDate = new Date(year, month, 1).toISOString()
            const endDate = new Date(year, month + 1, 0).toISOString()

            const res = await fetch(
                `/api/time-entries?userId=${selectedEmployee.id}&startDate=${startDate}&endDate=${endDate}`
            )
            const data = await res.json()
            setTimeEntries(data)
        } catch (error) {
            console.error('Failed to fetch time entries', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee || !selectedDate) return

        try {
            const url = '/api/time-entries'
            const method = editingEntry ? 'PATCH' : 'POST'
            const body = editingEntry
                ? { id: editingEntry.id, ...formData }
                : {
                    userId: selectedEmployee.id,
                    date: selectedDate.toISOString(),
                    ...formData
                }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setIsModalOpen(false)
                setEditingEntry(null)
                fetchTimeEntries()
                fetchEmployees()
                setFormData({ type: 'work', hours: 8, note: '' })
            }
        } catch (error) {
            console.error('Failed to save entry', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Eintrag wirklich löschen?')) return

        try {
            const res = await fetch(`/api/time-entries?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchTimeEntries()
                fetchEmployees()
            }
        } catch (error) {
            console.error('Failed to delete entry', error)
        }
    }

    const openAddModal = (date: Date) => {
        setSelectedDate(date)
        setEditingEntry(null)
        setFormData({ type: 'work', hours: 8, note: '' })
        setIsModalOpen(true)
    }

    const openEditModal = (entry: TimeEntry) => {
        setEditingEntry(entry)
        setSelectedDate(new Date(entry.date))
        setFormData({
            type: entry.type,
            hours: entry.hours || 8,
            note: entry.note || ''
        })
        setIsModalOpen(true)
    }

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        const days: Date[] = []
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }
        return days
    }

    const getEntryForDate = (date: Date) => {
        return timeEntries.find(entry => {
            const entryDate = new Date(entry.date)
            return entryDate.toDateString() === date.toDateString()
        })
    }

    const calculateDailyDeficit = (date: Date) => {
        if (!selectedEmployee) return 0

        const entry = getEntryForDate(date)
        const dailyTarget = selectedEmployee.weeklyHours / 5

        // Skip weekends
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) return 0

        if (!entry) return -dailyTarget

        if (entry.type !== 'work') return 0 // Vacation/sick/holiday count as target

        return (entry.hours || 0) - dailyTarget
    }

    const getStatusColor = (deficit: number) => {
        if (deficit < 0) return 'text-red-400'
        if (deficit === 0) return 'text-slate-400'
        return 'text-green-400'
    }

    const getStatusText = (deficit: number) => {
        if (deficit < 0) return '⚠ Pending'
        if (deficit === 0) return '✓ OK'
        return '✓ Überstunden'
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            work: 'Arbeit',
            vacation: 'Urlaub',
            sick: 'Krank',
            holiday: 'Feiertag'
        }
        return labels[type as keyof typeof labels] || type
    }

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Zeiterfassung</h1>
                        <p className="text-secondary">Tägliche Arbeitszeitübersicht</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-surface border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                    {/* Employee Selector */}
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                            style={{ backgroundColor: selectedEmployee?.color || '#3b82f6' }}
                        >
                            {selectedEmployee ? `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}` : '?'}
                        </div>
                        <select
                            value={selectedEmployee?.id || ''}
                            onChange={(e) => {
                                const emp = employees.find(emp => emp.id === e.target.value)
                                setSelectedEmployee(emp || null)
                            }}
                            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="text-white" size={20} />
                        </button>

                        <h2 className="text-lg font-semibold text-white capitalize min-w-[200px] text-center">
                            {monthName}
                        </h2>

                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronRight className="text-white" size={20} />
                        </button>
                    </div>

                    <div className="w-[200px]"></div> {/* Spacer for alignment */}
                </div>

                {/* Time Entry Table */}
                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stunden gearbeitet</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pausen</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Überstunden / Defizit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Laden...</td>
                                    </tr>
                                ) : (
                                    getDaysInMonth().map((date) => {
                                        const entry = getEntryForDate(date)
                                        const deficit = calculateDailyDeficit(date)
                                        const dayOfWeek = date.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                                        return (
                                            <tr
                                                key={date.toISOString()}
                                                className={`hover:bg-slate-800/30 transition-colors ${isWeekend ? 'bg-slate-900/30' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </p>
                                                        {isWeekend && (
                                                            <span className="text-xs text-slate-500">Wochenende</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {entry ? (
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {entry.type === 'work' ? `${entry.hours || 0}h` : getTypeLabel(entry.type)}
                                                            </p>
                                                            {entry.note && (
                                                                <p className="text-xs text-slate-400 mt-1">{entry.note}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-500">—</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!isWeekend && (
                                                        <span className={`font-medium ${getStatusColor(deficit)}`}>
                                                            {deficit > 0 ? '+' : ''}{deficit.toFixed(1)}h
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!isWeekend && (
                                                        <span className={getStatusColor(deficit)}>
                                                            {getStatusText(deficit)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {entry ? (
                                                            <>
                                                                <button
                                                                    onClick={() => openEditModal(entry)}
                                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-700/50 rounded transition-colors"
                                                                    title="Bearbeiten"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                                                                    title="Löschen"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => openAddModal(date)}
                                                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-700/50 rounded transition-colors"
                                                                title="Eintrag hinzufügen"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Entry Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingEntry(null)
                }}
                title={`${editingEntry ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen'} - ${selectedDate?.toLocaleDateString('de-DE')}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Typ</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="work">Arbeit</option>
                            <option value="vacation">Urlaub</option>
                            <option value="sick">Krank</option>
                            <option value="holiday">Feiertag</option>
                        </select>
                    </div>

                    {formData.type === 'work' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Stunden</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={formData.hours}
                                onChange={e => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Notiz (optional)</label>
                        <textarea
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                setEditingEntry(null)
                            }}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                        >
                            {editingEntry ? 'Aktualisieren' : 'Hinzufügen'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    )
}
