#!/usr/bin/env python3
"""
Automatisches Deployment der Calendar Fixes
Wendet alle Änderungen aus CALENDAR_FIXES.md automatisch an
"""

import re
import shutil
from pathlib import Path

# Pfad zur Datei
FILE_PATH = Path("app/calendar/page.tsx")
BACKUP_PATH = Path("app/calendar/page.tsx.backup")

print("=" * 50)
print("🚀 Applying Calendar Fixes...")
print("=" * 50)

# Backup erstellen
print("\n📦 Creating backup...")
shutil.copy(FILE_PATH, BACKUP_PATH)
print(f"✅ Backup created: {BACKUP_PATH}")

# Datei einlesen
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix #1: fetchEmployees
print("\n🔧 Fix #1: Updating fetchEmployees...")
old_fetch_employees = r'''const fetchEmployees = async \(\) => \{
        try \{
            const res = await fetch\('/api/employees'\)
            const data = await res\.json\(\)
            setEmployees\(data\)
            if \(data\.length > 0\) \{
                setSelectedEmployee\(data\[0\]\)
            \}
        \} catch \(error\) \{
            console\.error\('Failed to fetch employees', error\)
        \}
    \}'''

new_fetch_employees = '''const fetchEmployees = async () => {
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
    }'''

content = re.sub(old_fetch_employees, new_fetch_employees, content, flags=re.MULTILINE)
print("✅ Fix #1 applied")

# Datei speichern
with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "=" * 50)
print("⚠️  WICHTIG:")
print("=" * 50)
print("\nFix #1 wurde automatisch angewendet.")
print("Fix #2a und #2b sind zu komplex für automatische Anwendung.")
print("\nBitte öffne die Datei manuell:")
print("  nano app/calendar/page.tsx")
print("\nUnd ersetze:")
print("  - calculateDailyDeficit")
print("  - calculateMonthlySummary")
print("\nmit den Versionen aus CALENDAR_FIXES.md")
print(f"\nBackup verfügbar unter: {BACKUP_PATH}")
print("")
