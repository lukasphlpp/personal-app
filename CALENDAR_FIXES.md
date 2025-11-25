# Kalender-Fixes für Multi-Entry System

## Übersicht der Änderungen

Diese Datei beschreibt die drei notwendigen Änderungen an `app/calendar/page.tsx`:

1. ✅ Mitarbeiter-Auswahl nach Speichern beibehalten
2. ✅ Überstundenberechnung ab Eintrittsdatum
3. ✅ Ganztägige Abwesenheiten = 8 Stunden (statt variable Stunden)

---

## 1. Mitarbeiter-Auswahl beibehalten

**Datei:** `app/calendar/page.tsx`  
**Zeilen:** 63-74  
**Problem:** Nach dem Speichern eines Eintrags springt die Ansicht zurück zum ersten Mitarbeiter

### Alte Version:
```typescript
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
```

### Neue Version:
```typescript
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
```

---

## 2. Überstundenberechnung ab Eintrittsdatum

### 2a) calculateDailyDeficit Funktion

**Zeilen:** ca. 328-358  
**Problem:** Zeigt Minusstunden für Tage vor dem Eintrittsdatum an

### Alte Version:
```typescript
const calculateDailyDeficit = (date: Date) => {
    if (!selectedEmployee) return 0

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
        } else {
            // vacation, sick, holiday, overtime_reduction
            const hoursWorked = entry.halfDay ? dailyTarget / 2 : dailyTarget
            totalWorked += hoursWorked
        }
    })
    return totalWorked - dailyTarget
}
```

### Neue Version:
```typescript
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
```

### 2b) calculateMonthlySummary Funktion

**Zeilen:** ca. 429-475  
**Problem:** Berechnet Überstunden für den gesamten Monat, nicht ab Eintrittsdatum

### Alte Version:
```typescript
const calculateMonthlySummary = () => {
    if (!selectedEmployee) return null

    const days = getDaysInMonth()
    const workDays = days.filter(d => {
        const dow = d.getDay()
        return dow !== 0 && dow !== 6
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
                    const dailyTarget = selectedEmployee.weeklyHours / 5
                    const hoursWorked = entry.halfDay ? dailyTarget / 2 : dailyTarget
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
```

### Neue Version:
```typescript
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
```

---

## 3. Ganztägige Abwesenheiten = 8 Stunden

**Bereits in Änderung 2 enthalten!**

Die Änderungen in `calculateDailyDeficit` und `calculateMonthlySummary` setzen bereits:
- **Ganztägig:** Urlaub/Krank/Feiertag = **8 Stunden**
- **Halbtags:** Urlaub/Krank/Feiertag = **4 Stunden**
- **Überstundenabbau:** Verwendet weiterhin die individuellen Sollstunden des Mitarbeiters

---

## Deployment-Schritte

1. **Öffne** `app/calendar/page.tsx` auf deinem Server
2. **Suche** nach den drei Funktionen:
   - `fetchEmployees` (Zeile ~63)
   - `calculateDailyDeficit` (Zeile ~328)
   - `calculateMonthlySummary` (Zeile ~429)
3. **Ersetze** jede Funktion mit der neuen Version aus diesem Dokument
4. **Speichere** die Datei
5. **Teste** die Änderungen:
   - Erstelle einen Eintrag → Mitarbeiter sollte gleich bleiben
   - Mitarbeiter mit Eintrittsdatum gestern → Keine Minusstunden für vergangene Tage
   - Ganztägiger Urlaub → Sollte 8 Stunden anzeigen

---

## Zusätzliche Hinweise

### Interface Employee muss `startDate` haben:
Stelle sicher, dass das `Employee` Interface (Zeile ~8) das Feld `startDate` enthält:

```typescript
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
    startDate: string  // ← Stelle sicher, dass dies vorhanden ist
}
```

Falls nicht vorhanden, füge diese Zeile hinzu!

---

**Viel Erfolg beim Deployment! 🚀**

---

## 🆕 Fix #4: Arbeitszeiten-Felder bei Urlaub/Krank/Feiertag ausblenden

**Problem:** Aktuell werden auch bei Urlaub, Krankheit oder Feiertagen die Arbeitszeiten-Felder angezeigt. Diese sollten nur bei "Arbeit" sichtbar sein.

**Lösung:** Das Formular zeigt bereits korrekt nur bei `entryType === 'work'` die Zeitfelder an (Zeile 827-900). **Keine Änderung nötig!**

### ✅ Wie es funktioniert:

1. **Bei Urlaub/Krank/Feiertag/Überstundenabbau:**
   - Zeigt nur "Zeitraum" Dropdown (Ganztags/Vormittag/Nachmittag)
   - **Keine** Arbeitszeiten-Felder
   - Backend setzt automatisch:
     - Ganztags = 8 Stunden (0 Minuten Pause)
     - Halbtags = 4 Stunden (0 Minuten Pause)

2. **Bei Arbeit:**
   - Zeigt Arbeitszeiten-Felder
   - Berechnet automatisch Pausen zwischen Zeitslots
   - Prüft Pausenpflicht (6h → 30min, 9h → 45min)

### 🔍 Überprüfung:

Das Formular sollte bereits korrekt funktionieren. Falls du trotzdem Arbeitszeiten-Felder bei Urlaub siehst, überprüfe:

**Zeile 827 in `app/calendar/page.tsx`:**
```typescript
{entryType === 'work' && (
    <>
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Arbeitszeiten</label>
            {/* ... Zeitfelder ... */}
        </div>
    </>
)}
```

**Zeile 812 sollte sein:**
```typescript
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
```

### ⚠️ Wichtig für Backend:

Die automatische 8-Stunden-Zuweisung passiert bereits in den Funktionen aus **Fix #2**:

- `calculateDailyDeficit`: Zeile ~345
- `calculateMonthlySummary`: Zeile ~460

Diese setzen für Urlaub/Krank/Feiertag:
- **Ganztags:** `hoursWorked = 8`
- **Halbtags:** `hoursWorked = 4`

**Keine weiteren Änderungen nötig!** ✅

---

**Ende der Anleitung**
