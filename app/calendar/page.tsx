'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    weeklyHours: number
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

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee || !selectedDate) return

        try {
            const res = await fetch('/api/time-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedEmployee.id,
                    date: selectedDate.toISOString(),
                    ...formData
                })
            })

            if (res.ok) {
                setIsModalOpen(false)
                fetchTimeEntries()
                fetchEmployees() // Refresh to update overtime balance
                setFormData({ type: 'work', hours: 8, note: '' })
            }
        } catch (error) {
            console.error('Failed to add entry', error)
        }
    }

    const openAddModal = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    // Calendar helpers
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days: (Date | null)[] = []

        // Add empty cells for days before month starts
        for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
            days.push(null)
        }

        // Add days of month
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

    const getDayColor = (date: Date) => {
        if (!selectedEmployee) return 'bg-slate-800'

        const entry = getEntryForDate(date)
        if (!entry) return 'bg-slate-800'

        const dailyTarget = selectedEmployee.weeklyHours / 5

        if (entry.type !== 'work') {
            return 'bg-blue-500/20 border-blue-500/30' // Vacation/Sick/Holiday
        }

        if (!entry.hours) return 'bg-slate-800'

        if (entry.hours < dailyTarget) return 'bg-red-500/20 border-red-500/30'
        if (entry.hours === dailyTarget) return 'bg-slate-700/50 border-slate-600'
        return 'bg-green-500/20 border-green-500/30'
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

    const getTypeColor = (type: string) => {
        const colors = {
            work: 'text-white',
            vacation: 'text-blue-400',
            sick: 'text-orange-400',
            holiday: 'text-purple-400'
        }
        return colors[type as keyof typeof colors] || 'text-white'
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
                        <h1 className="text-3xl font-bold text-white mb-2">Kalender</h1>
                        <p className="text-secondary">Zeiterfassung und Übersicht</p>
                    </div>

                    {/* Employee Selector */}
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedEmployee?.id || ''}
                            onChange={(e) => {
                                const emp = employees.find(emp => emp.id === e.target.value)
                                setSelectedEmployee(emp || null)
                            }}
                            className="bg-surface border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="bg-surface border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="text-white" size={20} />
                    </button>

                    <h2 className="text-xl font-semibold text-white capitalize">{monthName}</h2>

                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronRight className="text-white" size={20} />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-surface border border-slate-700 rounded-xl p-6">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {getDaysInMonth().map((date, index) => (
                            <div
                                key={index}
                                className={`min-h-[100px] border rounded-lg p-2 transition-all ${date
                                        ? `${getDayColor(date)} cursor-pointer hover:border-primary`
                                        : 'bg-slate-900/20 border-slate-800'
                                    }`}
                                onClick={() => date && openAddModal(date)}
                            >
                                {date && (
                                    <>
                                        <div className="text-sm font-medium text-white mb-1">
                                            {date.getDate()}
                                        </div>
                                        {(() => {
                                            const entry = getEntryForDate(date)
                                            if (entry) {
                                                return (
                                                    <div className="space-y-1">
                                                        <div className={`text-xs font-medium ${getTypeColor(entry.type)}`}>
                                                            {getTypeLabel(entry.type)}
                                                        </div>
                                                        {entry.hours && (
                                                            <div className="text-xs text-slate-300 flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {entry.hours}h
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="bg-surface border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Legende</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
                            <span className="text-xs text-slate-300">Unter Soll</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-slate-700/50 border border-slate-600"></div>
                            <span className="text-xs text-slate-300">Soll erreicht</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
                            <span className="text-xs text-slate-300">Über Soll</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div>
                            <span className="text-xs text-slate-300">Urlaub/Krank/Feiertag</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Entry Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Eintrag hinzufügen - ${selectedDate?.toLocaleDateString('de-DE')}`}
            >
                <form onSubmit={handleAddEntry} className="space-y-4">
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
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                        >
                            Eintrag hinzufügen
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    )
}
