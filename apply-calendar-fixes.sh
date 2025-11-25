#!/bin/bash

###############################################################################
# Automatisches Deployment der Calendar Fixes
# Wendet alle Änderungen aus CALENDAR_FIXES.md automatisch an
###############################################################################

set -e

echo "=================================="
echo "🚀 Applying Calendar Fixes..."
echo "=================================="

# Backup erstellen
echo "📦 Creating backup..."
cp app/calendar/page.tsx app/calendar/page.tsx.backup
echo "✅ Backup created: app/calendar/page.tsx.backup"

# Fix #1: fetchEmployees - Mitarbeiter-Auswahl beibehalten
echo ""
echo "🔧 Fix #1: Updating fetchEmployees..."
sed -i '/const fetchEmployees = async/,/^    }$/c\
    const fetchEmployees = async () => {\
        try {\
            const res = await fetch('\''/api/employees'\'')\
            const data = await res.json()\
            setEmployees(data)\
            // Only set first employee if none is selected yet\
            if (data.length > 0 && !selectedEmployee) {\
                setSelectedEmployee(data[0])\
            } else if (selectedEmployee) {\
                // Update the selected employee with fresh data\
                const updated = data.find((e: Employee) => e.id === selectedEmployee.id)\
                if (updated) setSelectedEmployee(updated)\
            }\
        } catch (error) {\
            console.error('\''Failed to fetch employees'\'', error)\
        }\
    }' app/calendar/page.tsx

echo "✅ Fix #1 applied"

# Fix #2a: calculateDailyDeficit - Eintrittsdatum berücksichtigen
echo ""
echo "🔧 Fix #2a: Updating calculateDailyDeficit..."
# Dieser Fix ist komplexer und sollte manuell gemacht werden
echo "⚠️  Fix #2a requires manual editing (see CALENDAR_FIXES.md)"

# Fix #2b: calculateMonthlySummary - Eintrittsdatum berücksichtigen  
echo ""
echo "🔧 Fix #2b: Updating calculateMonthlySummary..."
echo "⚠️  Fix #2b requires manual editing (see CALENDAR_FIXES.md)"

echo ""
echo "=================================="
echo "⚠️  WICHTIG:"
echo "=================================="
echo ""
echo "Fix #1 wurde automatisch angewendet."
echo "Fix #2a und #2b müssen manuell angewendet werden."
echo ""
echo "Öffne die Datei mit:"
echo "  nano app/calendar/page.tsx"
echo ""
echo "Suche nach 'calculateDailyDeficit' und 'calculateMonthlySummary'"
echo "und ersetze sie mit den Versionen aus CALENDAR_FIXES.md"
echo ""
echo "Backup verfügbar unter: app/calendar/page.tsx.backup"
echo ""
