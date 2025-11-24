export interface Employee {
    id: string
    email: string
    firstName: string
    lastName: string
    department: string
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    color: string
    startDate: string
}

export interface TimeEntry {
    id: string
    userId: string
    date: string
    type: 'work' | 'vacation' | 'sick' | 'holiday'
    hours?: number
    note?: string
}

export interface Category {
    id: string
    value: string
    label: string
    color: string
}

export const DEPARTMENTS = [
    'Entwicklung',
    'Design',
    'Marketing',
    'Vertrieb',
    'HR',
    'Finanzen'
]

export const ROLES = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Mitarbeiter' }
]
