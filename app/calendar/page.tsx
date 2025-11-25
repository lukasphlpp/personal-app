'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, Clock, Calendar as CalendarIcon, TrendingUp, Edit2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { formatHoursToTime, formatMinutesToTime } from '@/lib/timeUtils'

interface Employee {
    id: string
    employeeId: string
    firstName: string
    lastName: string
    weeklyHours: number
    overtimeBalance: number
    vacationDays: number
    vacationDaysUsed: number
    defaultSchedule?: { startTime: string, endTime: string }[] | null
    color: string
    startDate: string  // ← DIESE ZEILE HINZUFÜGEN
}

interface TimeSlot {
    startTime: string
    endTime: string
}

interface TimeEntry {
    id: string
    userId: string
    date: string
    type: 'work' | 'vacation' | 'sick' | 'holiday' | 'overtime_reduction'
    halfDay: string | null
    timeSlots: TimeSlot[] | null
    breakMinutes: number | null
    hours: number | null
    note: string | null
}

export default function CalendarPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [expandedDay, setExpandedDay] = useState<string | null>(null)
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

    // Form state for expanded day
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ startTime: '08:00', endTime: '12:00' }])
    const [entryType, setEntryType] = useState<'work' | 'vacation' | 'sick' | 'holiday' | 'overtime_reduction'>('work')
    const [halfDay, setHalfDay] = useState<string | null>(null)
    const [note, setNote] = useState('')

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
            // Only set first employee if none is selected yet
            if (data.length > 0 && !selectedEmployee) {
                setSelectedEmployee(data[0])
            } else if (selectedEmployee) {
                // Update the selected employee with fresh data
                const updated = data.find((e: Employee) => e.id === selectedEmployee.id)
                if (updated) setSelectedEmployee(updated)
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

    const toggleDay = (dateStr: string) => {
        if (expandedDay === dateStr) {
            setExpandedDay(null)
            setEditingEntryId(null)
            resetForm()
        } else {
            setExpandedDay(dateStr)
            setEditingEntryId(null)
            resetForm()
        }
    }

    const editEntry = (entry: TimeEntry) => {
        setEditingEntryId(entry.id)
        setEntryType(entry.type)
        setHalfDay(entry.halfDay)
        setNote(entry.note || '')
        if (entry.timeSlots && entry.timeSlots.length > 0) {
            setTimeSlots(entry.timeSlots)
        } else {
            setTimeSlots([{ startTime: '08:00', endTime: '12:00' }])
        }
    }

    const resetForm = () => {
        if (selectedEmployee?.defaultSchedule && Array.isArray(selectedEmployee.defaultSchedule) && selectedEmployee.defaultSchedule.length > 0) {
            setTimeSlots(selectedEmployee.defaultSchedule)
        } else {
            setTimeSlots([{ startTime: '08:00', endTime: '16:30' }])
        }
        setEntryType('work')
        setHalfDay(null)
        setNote('')
    }

    const addTimeSlot = () => {
        const sorted = sortedTimeSlots()
        const lastSlot = sorted[sorted.length - 1]
        const [endH, endM] = lastSlot.endTime.split(':').map(Number)
        const newStartH = endH + 1
        const newStart = `${String(Math.min(newStartH, 23)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
        const newEnd = `${String(Math.min(newStartH + 4, 23)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

        setTimeSlots([...timeSlots, { startTime: newStart, endTime: newEnd }])
    }

    const removeTimeSlot = (index: number) => {
        setTimeSlots(timeSlots.filter((_, i) => i !== index))
    }

    const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const updated = [...timeSlots]
        updated[index][field] = value
        setTimeSlots(updated)
    }

    const sortedTimeSlots = () => {
        return [...timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + m
    }

    const calculateTotalHours = () => {
        let totalMinutes = 0
        timeSlots.forEach(slot => {
            if (!slot.startTime || !slot.endTime || slot.startTime.includes('-') || slot.endTime.includes('-')) {
                return // Skip invalid slots
            }
            const startMinutes = timeToMinutes(slot.startTime)
            const endMinutes = timeToMinutes(slot.endTime)
            totalMinutes += endMinutes - startMinutes
        })
        return totalMinutes / 60
    }

    const calculateBreakMinutes = () => {
        if (timeSlots.length < 2) return 0

        const sorted = sortedTimeSlots().filter(s => s.startTime && s.endTime && !s.startTime.includes('-') && !s.endTime.includes('-'))
        let breakMinutes = 0

        for (let i = 0; i < sorted.length - 1; i++) {
            const endMinutes = timeToMinutes(sorted[i].endTime)
            const startMinutes = timeToMinutes(sorted[i + 1].startTime)
            breakMinutes += startMinutes - endMinutes
        }

        return breakMinutes
    }

    const getBreaksBetweenSlots = () => {
        if (timeSlots.length < 2) return []

        const sorted = sortedTimeSlots()
        const breaks: { afterIndex: number, minutes: number }[] = []

        for (let i = 0; i < sorted.length - 1; i++) {
            if (!sorted[i].endTime || !sorted[i + 1].startTime) continue
            const endMinutes = timeToMinutes(sorted[i].endTime)
            const startMinutes = timeToMinutes(sorted[i + 1].startTime)
            breaks.push({ afterIndex: i, minutes: startMinutes - endMinutes })
        }

        return breaks
    }

    const checkBreakCompliance = (hours: number, breakMinutes: number) => {
        if (hours > 9 && breakMinutes < 45) {
            return { compliant: false, required: 45, message: 'Nach 9 Stunden sind 45 Min. Pause erforderlich' }
        }
        if (hours > 6 && breakMinutes < 30) {
            return { compliant: false, required: 30, message: 'Nach 6 Stunden sind 30 Min. Pause erforderlich' }
        }
        return { compliant: true, required: 0, message: '' }
    }

    const validateTimeSlots = () => {
        for (const slot of timeSlots) {
            if (!slot.startTime || !slot.endTime || slot.startTime.includes('-') || slot.endTime.includes('-')) {
                return { valid: false, message: 'Bitte alle Zeitfelder ausfüllen' }
            }
        }
        return { valid: true, message: '' }
    }

    const saveEntry = async () => {
        if (!selectedEmployee || !expandedDay) return

        if (entryType === 'work') {
            const validation = validateTimeSlots()
            if (!validation.valid) {
                alert(validation.message)
                return
            }

            const totalHours = calculateTotalHours()
            const breakMinutes = calculateBreakMinutes()

            if (breakMinutes < 0) {
                alert('Zeiträume überschneiden sich! Bitte korrigieren.')
                return
            }
        }



        try {
            const url = '/api/time-entries'
            const method = editingEntryId ? 'PATCH' : 'POST'

            const totalHours = entryType === 'work' ? calculateTotalHours() : null
            const breakMinutes = entryType === 'work' ? calculateBreakMinutes() : null

            const body = entryType === 'work' ? {
                ...(editingEntryId && { id: editingEntryId }),
                userId: selectedEmployee.id,
                date: new Date(expandedDay).toISOString(),
                type: entryType,
                halfDay: null,
                timeSlots: sortedTimeSlots(),
                breakMinutes,
                hours: totalHours,
                note
            } : {
                ...(editingEntryId && { id: editingEntryId }),
                userId: selectedEmployee.id,
                date: new Date(expandedDay).toISOString(),
                type: entryType,
                halfDay,
                timeSlots: null,
                breakMinutes: null,
                hours: null,
                note
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                // Keep expanded day open but reset form to allow adding more entries
                setEditingEntryId(null)
                fetchTimeEntries()
                fetchEmployees()
                resetForm()
            }
        } catch (error) {
            console.error('Failed to save entry', error)
        }
    }

    const deleteEntry = async (id: string) => {
        if (!confirm('Eintrag wirklich löschen?')) return

        try {
            const res = await fetch(`/api/time-entries?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchTimeEntries()
                fetchEmployees()
                // If we deleted the entry we were editing, reset form
                if (editingEntryId === id) {
                    setEditingEntryId(null)
                    resetForm()
                }
            }
        } catch (error) {
            console.error('Failed to delete entry', error)
        }
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

    const getEntriesForDate = (date: Date) => {
        return timeEntries.filter(entry => {
            const entryDate = new Date(entry.date)
            return entryDate.toDateString() === date.toDateString()
        })
    }

    const calculateDailyDeficit = (date: Date) => {
        if (!selectedEmployee) return 0
    
        const employeeStartDate = new Date(selectedEmployee.startDate)
        // If date is before employee start date, no deficit
        if (date < employeeStartDate) return 0
    
        const dayOfWeek = date.getDay()
        const dailyTarget = selectedEmployee.weeklyHours / 5
    
        // Weekend = no deficit
        if (dayOfWeek === 0 || dayOfWeek === 6) return 0
    
        const entries = getEntriesForDate(date)
        if (entries.length === 0) return -dailyTarget
    
        let totalWorked = 0
        entries.forEach(entry => {
            if (entry.type === 'work') {
                totalWorked += entry.hours || 0
            } else if (entry.type === 'vacation' || entry.type === 'sick' || entry.type === 'holiday') {
                // Full-day absences = 8 hours, half-day = 4 hours
                const hoursWorked = entry.halfDay ? 4 : 8
                totalWorked += hoursWorked
            } else if (entry.type === 'overtime_reduction') {
                // Overtime reduction uses employee's daily target
                const hoursWorked = entry.halfDay ? dailyTarget / 2 : dailyTarget
                totalWorked += hoursWorked
            }
        })
        return totalWorked - dailyTarget
    }

    const getStatusColor = (deficit: number) => {
        if (deficit < 0) return 'text-red-400'
        if (deficit === 0) return 'text-slate-400'
        return 'text-green-400'
    }

    const getStatusBadge = (date: Date, entry: TimeEntry | undefined) => {
        if (!entry) return null

        const badges: { text: string, color: string, tooltip?: string }[] = []

        // Entry type badges
        if (entry.type === 'vacation') {
            badges.push({
                text: entry.halfDay === 'morning' ? '🏖️ Urlaub (VM)' : entry.halfDay === 'afternoon' ? '🏖️ Urlaub (NM)' : '🏖️ Urlaub',
                color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            })
        } else if (entry.type === 'sick') {
            badges.push({
                text: entry.halfDay === 'morning' ? '🤒 Krank (VM)' : entry.halfDay === 'afternoon' ? '🤒 Krank (NM)' : '🤒 Krank',
                color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            })
        } else if (entry.type === 'holiday') {
            badges.push({
                text: '🎉 Feiertag',
                color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            })
        } else if (entry.type === 'overtime_reduction') {
            badges.push({
                text: entry.halfDay === 'morning' ? '⏰ Überstunden abbau (VM)' : entry.halfDay === 'afternoon' ? '⏰ Überstunden abbau (NM)' : '⏰ Überstunden abbau',
                color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            })
        }

        // Break compliance check for work entries
        if (entry.type === 'work' && entry.hours && entry.breakMinutes !== null) {
            const check = checkBreakCompliance(entry.hours, entry.breakMinutes)
            if (!check.compliant) {
                badges.push({
                    text: '⚠️ Pausenpflicht',
                    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    tooltip: check.message
                })
            }
        }

        return badges
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            work: 'Arbeit',
            vacation: 'Urlaub',
            sick: 'Krank',
            holiday: 'Feiertag',
            overtime_reduction: 'Überstunden abbau'
        }
        return labels[type as keyof typeof labels] || type
    }

    // Monthly summary calculations
    const calculateMonthlySummary = () => {
        if (!selectedEmployee) return null
    
        const days = getDaysInMonth()
        const employeeStartDate = new Date(selectedEmployee.startDate)
        
        // Filter work days that are after employee start date
        const workDays = days.filter(d => {
            const dow = d.getDay()
            const isWeekday = dow !== 0 && dow !== 6
            const isAfterStartDate = d >= employeeStartDate
            return isWeekday && isAfterStartDate
        })
    
        let totalWorked = 0
        let totalExpected = workDays.length * (selectedEmployee.weeklyHours / 5)
        let totalBreak = 0
        let daysWithEntries = 0
    
        workDays.forEach(day => {
            const entries = getEntriesForDate(day)
            if (entries.length > 0) {
                daysWithEntries++
                entries.forEach(entry => {
                    if (entry.type === 'work' && entry.hours) {
                        totalWorked += entry.hours
                        totalBreak += (entry.breakMinutes || 0) / 60
                    } else if (entry.type === 'vacation' || entry.type === 'sick' || entry.type === 'holiday') {
                        // Full-day absences = 8 hours, half-day = 4 hours
                        const hoursWorked = entry.halfDay ? 4 : 8
                        totalWorked += hoursWorked
                    } else if (entry.type === 'overtime_reduction') {
                        const dailyTarget = selectedEmployee.weeklyHours / 5
                        const hoursWorked = entry.halfDay ? dailyTarget / 2 : dailyTarget
                        totalWorked += hoursWorked
                    }
                })
            }
        })
    
        const deficit = totalWorked - totalExpected
    
        return {
            totalWorked,
            totalExpected,
            totalBreak,
            deficit,
            daysWithEntries,
            totalWorkDays: workDays.length,
            vacationDays: selectedEmployee.vacationDays,
            vacationDaysUsed: selectedEmployee.vacationDaysUsed
        }
    }

    const summary = calculateMonthlySummary()

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Zeiterfassung</h1>
                        <p className="text-secondary">Tägliche Arbeitszeitübersicht</p>
                    </div>
                </div>

                <div className="bg-surface border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
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
                                setExpandedDay(null)
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

                    <div className="w-[200px]"></div>
                </div>

                {/* Monthly Summary */}
                {summary && (
                    <div className="bg-surface border border-slate-700 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Monatsübersicht</h3>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Arbeitsstunden</p>
                                <p className="text-2xl font-bold text-white">{formatHoursToTime(summary.totalWorked)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Soll-Stunden</p>
                                <p className="text-2xl font-bold text-slate-300">{formatHoursToTime(summary.totalExpected)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Verbleibend</p>
                                <p className="text-2xl font-bold text-slate-300">{formatHoursToTime(summary.totalExpected - summary.totalWorked)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Überstunden / Defizit</p>
                                <p className={`text-2xl font-bold ${summary.deficit > 0 ? 'text-green-400' : summary.deficit < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                    {summary.deficit > 0 ? '+' : ''}{formatHoursToTime(summary.deficit)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Arbeitstage</p>
                                <p className="text-2xl font-bold text-white">{summary.daysWithEntries} / {summary.workDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Gesamtpausen</p>
                                <p className="text-2xl font-bold text-white">{formatMinutesToTime(summary.totalBreak)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Urlaubstage</p>
                                <p className="text-2xl font-bold text-blue-400">{summary.vacationDaysUsed} / {summary.vacationDays}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8"></th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Arbeitsstunden</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pausenzeit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Überstunden / Defizit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Laden...</td>
                                    </tr>
                                ) : (
                                    getDaysInMonth().map((date) => {
                                        const entries = getEntriesForDate(date)
                                        const deficit = calculateDailyDeficit(date)
                                        const dayOfWeek = date.getDay()
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                        const dateStr = date.toDateString()
                                        const isExpanded = expandedDay === dateStr
                                        const today = new Date()
                                        today.setHours(0, 0, 0, 0)
                                        const checkDate = new Date(date)
                                        checkDate.setHours(0, 0, 0, 0)
                                        const isFuture = checkDate > today

                                        const statusBadges = entries.flatMap(e => getStatusBadge(date, e) || [])

                                        let rowBackground = isWeekend ? 'bg-slate-900/30 hover:bg-slate-800/30' : 'hover:bg-slate-800/30'
                                        if (entries.some(e => e.type === 'sick')) rowBackground = 'bg-orange-500/10 hover:bg-orange-500/20'
                                        else if (entries.some(e => e.type === 'vacation')) rowBackground = 'bg-blue-500/10 hover:bg-blue-500/20'
                                        else if (entries.some(e => e.type === 'holiday')) rowBackground = 'bg-purple-500/10 hover:bg-purple-500/20'
                                        else if (entries.some(e => e.type === 'overtime_reduction')) rowBackground = 'bg-cyan-500/10 hover:bg-cyan-500/20'

                                        return (
                                            <React.Fragment key={dateStr}>
                                                <tr
                                                    className={`transition-colors cursor-pointer ${rowBackground} ${isFuture ? 'opacity-50' : ''}`}
                                                    onClick={() => !isFuture && toggleDay(dateStr)}
                                                >
                                                    <td className="px-6 py-4">
                                                        {!isFuture && (
                                                            isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />
                                                        )}
                                                    </td>
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
                                                        {entries.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {entries.map((entry, idx) => (
                                                                    <div key={idx}>
                                                                        <p className="text-white font-medium">
                                                                            {entry.type === 'work' ? formatHoursToTime(entry.hours || 0) : getTypeLabel(entry.type)}
                                                                        </p>
                                                                        {entry.timeSlots && entry.timeSlots.length > 0 && (
                                                                            <p className="text-xs text-slate-400">
                                                                                {entry.timeSlots.map((slot, i) => (
                                                                                    <span key={i}>
                                                                                        {slot.startTime}-{slot.endTime}
                                                                                        {i < entry.timeSlots!.length - 1 && ', '}
                                                                                    </span>
                                                                                ))}
                                                                            </p>
                                                                        )}
                                                                        {entry.note && (
                                                                            <p className="text-xs text-slate-400 mt-1">{entry.note}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {entries.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {entries.map((entry, idx) => (
                                                                    <div key={idx}>
                                                                        {entry.breakMinutes !== null && entry.breakMinutes !== undefined ? (
                                                                            <span className={entry.breakMinutes < 0 ? 'text-red-400' : 'text-white'}>
                                                                                {formatMinutesToTime(entry.breakMinutes)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-500">—</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {!isWeekend && !isFuture && (entries.length > 0 || deficit !== 0) && (
                                                            <span className={`font-medium ${getStatusColor(deficit)}`}>
                                                                {deficit > 0 ? '+' : ''}{formatHoursToTime(deficit)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {statusBadges && statusBadges.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {statusBadges.map((badge, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={`text-xs px-2 py-1 rounded border ${badge.color}`}
                                                                        title={badge.tooltip}
                                                                    >
                                                                        {badge.text}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-slate-800/50">
                                                        <td colSpan={6} className="px-6 py-6">
                                                            <div className="max-w-4xl space-y-6">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h3 className="text-lg font-semibold text-white">
                                                                        Einträge für {date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                                    </h3>
                                                                </div>

                                                                {entries.length > 0 && (
                                                                    <div className="space-y-3 mb-6">
                                                                        {entries.map(entry => (
                                                                            <div key={entry.id} className={`p-4 rounded-lg border flex justify-between items-center ${editingEntryId === entry.id ? 'bg-primary/10 border-primary' : 'bg-slate-900 border-slate-700'
                                                                                }`}>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-medium text-white">{getTypeLabel(entry.type)}</span>
                                                                                        {getStatusBadge(date, entry)?.map((badge, i) => (
                                                                                            <span key={i} className={`text-xs px-2 py-0.5 rounded border ${badge.color}`}>
                                                                                                {badge.text}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="text-sm text-slate-400 mt-1">
                                                                                        {entry.type === 'work' && entry.hours && (
                                                                                            <span>{formatHoursToTime(entry.hours)} • {formatMinutesToTime(entry.breakMinutes || 0)} Pause</span>
                                                                                        )}
                                                                                        {entry.timeSlots && entry.timeSlots.length > 0 && (
                                                                                            <span className="ml-2">
                                                                                                ({entry.timeSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')})
                                                                                            </span>
                                                                                        )}
                                                                                        {entry.note && <span className="block mt-1 italic">{entry.note}</span>}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            editEntry(entry)
                                                                                        }}
                                                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                                                                        title="Bearbeiten"
                                                                                    >
                                                                                        <Edit2 size={16} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            deleteEntry(entry.id)
                                                                                        }}
                                                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                                                                        title="Löschen"
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="bg-slate-900/30 p-6 rounded-lg border border-slate-700">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <h4 className="text-md font-medium text-slate-300">
                                                                            {editingEntryId ? 'Eintrag bearbeiten' : 'Neuen Eintrag hinzufügen'}
                                                                        </h4>
                                                                        {editingEntryId && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingEntryId(null)
                                                                                    resetForm()
                                                                                }}
                                                                                className="text-xs text-slate-400 hover:text-white"
                                                                            >
                                                                                Abbrechen
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-slate-300 mb-2">Typ</label>
                                                                            <select
                                                                                value={entryType}
                                                                                onChange={(e) => setEntryType(e.target.value as any)}
                                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                                            >
                                                                                <option value="work">Arbeit</option>
                                                                                <option value="vacation">Urlaub</option>
                                                                                <option value="sick">Krank</option>
                                                                                <option value="holiday">Feiertag</option>
                                                                                <option value="overtime_reduction">Überstunden abbau</option>
                                                                            </select>
                                                                        </div>

                                                                        {entryType !== 'work' && (
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-slate-300 mb-2">Zeitraum</label>
                                                                                <select
                                                                                    value={halfDay || 'full'}
                                                                                    onChange={(e) => setHalfDay(e.target.value === 'full' ? null : e.target.value)}
                                                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                >
                                                                                    <option value="full">Ganztags</option>
                                                                                    <option value="morning">Vormittag</option>
                                                                                    <option value="afternoon">Nachmittag</option>
                                                                                </select>
                                                                            </div>
                                                                        )}

                                                                        {entryType === 'work' && (
                                                                            <>
                                                                                <div>
                                                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Arbeitszeiten</label>
                                                                                    <div className="space-y-2">
                                                                                        {sortedTimeSlots().map((slot, sortedIndex) => {
                                                                                            const originalIndex = timeSlots.findIndex(
                                                                                                s => s.startTime === slot.startTime && s.endTime === slot.endTime
                                                                                            )
                                                                                            const breaks = getBreaksBetweenSlots()
                                                                                            const breakAfter = breaks.find(b => b.afterIndex === sortedIndex)

                                                                                            return (
                                                                                                <React.Fragment key={sortedIndex}>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <input
                                                                                                            type="time"
                                                                                                            value={slot.startTime}
                                                                                                            onChange={(e) => updateTimeSlot(originalIndex, 'startTime', e.target.value)}
                                                                                                            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                                        />
                                                                                                        <span className="text-slate-400">bis</span>
                                                                                                        <input
                                                                                                            type="time"
                                                                                                            value={slot.endTime}
                                                                                                            onChange={(e) => updateTimeSlot(originalIndex, 'endTime', e.target.value)}
                                                                                                            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                                        />
                                                                                                        {timeSlots.length > 1 && (
                                                                                                            <button
                                                                                                                onClick={() => removeTimeSlot(originalIndex)}
                                                                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                                                                                                            >
                                                                                                                <Trash2 size={16} />
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </div>

                                                                                                    {breakAfter && (
                                                                                                        <div className={`ml-12 text-sm ${breakAfter.minutes < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                                                                            ↓ Pause: {breakAfter.minutes} Min. {breakAfter.minutes < 0 && '(Überschneidung!)'}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </React.Fragment>
                                                                                            )
                                                                                        })}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={addTimeSlot}
                                                                                        className="mt-3 flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                                                                                    >
                                                                                        <Plus size={16} />
                                                                                        Weiteren Zeitraum hinzufügen
                                                                                    </button>
                                                                                </div>

                                                                                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg">
                                                                                    <div>
                                                                                        <p className="text-xs text-slate-400 mb-1">Arbeitsstunden</p>
                                                                                        <p className="text-lg font-semibold text-white">{formatHoursToTime(calculateTotalHours())}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-slate-400 mb-1">Pausenzeit</p>
                                                                                        <p className={`text-lg font-semibold ${calculateBreakMinutes() < 0 ? 'text-red-400' : 'text-white'}`}>
                                                                                            {formatMinutesToTime(calculateBreakMinutes())}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-slate-400 mb-1">Pausenpflicht</p>
                                                                                        {(() => {
                                                                                            const check = checkBreakCompliance(calculateTotalHours(), calculateBreakMinutes())
                                                                                            return check.compliant ? (
                                                                                                <p className="text-lg font-semibold text-green-400">✓ Erfüllt</p>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <AlertTriangle size={16} className="text-amber-400" />
                                                                                                    <p className="text-sm text-amber-400">{check.required} Min. nötig</p>
                                                                                                </div>
                                                                                            )
                                                                                        })()}
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        <div>
                                                                            <label className="block text-sm font-medium text-slate-300 mb-2">Notiz (optional)</label>
                                                                            <textarea
                                                                                value={note}
                                                                                onChange={(e) => setNote(e.target.value)}
                                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                rows={2}
                                                                            />
                                                                        </div>

                                                                        <div className="flex justify-end pt-4">
                                                                            <button
                                                                                onClick={saveEntry}
                                                                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                                                                            >
                                                                                {editingEntryId ? 'Änderungen speichern' : 'Eintrag speichern'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div >
                </div >
            </div >
        </AppLayout >
    )
}
