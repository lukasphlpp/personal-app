import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET: Fetch time entries for a user in a date range
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!userId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const entries = await prisma.timeEntry.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        return NextResponse.json(entries)
    } catch (error) {
        console.error('Error fetching time entries:', error)
        return NextResponse.json({ error: 'Error fetching time entries' }, { status: 500 })
    }
}

// POST: Create a new time entry
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { userId, date, type, halfDay, timeSlots, breakMinutes, hours, note } = body

        if (!userId || !date || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId,
                date: new Date(date),
                type,
                halfDay: halfDay || null,
                timeSlots: timeSlots || null,
                breakMinutes: breakMinutes !== undefined ? breakMinutes : null,
                hours: hours || null,
                note: note || null
            }
        })

        // Update overtime balance and vacation days
        await updateOvertimeBalance(userId)
        await updateVacationDays(userId)

        return NextResponse.json(entry, { status: 201 })
    } catch (error) {
        console.error('Error creating time entry:', error)
        return NextResponse.json({ error: 'Error creating time entry' }, { status: 500 })
    }
}

// PATCH: Update a time entry
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, type, halfDay, timeSlots, breakMinutes, hours, note } = body

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        const entry = await prisma.timeEntry.update({
            where: { id },
            data: {
                ...(type && { type }),
                ...(halfDay !== undefined && { halfDay }),
                ...(timeSlots !== undefined && { timeSlots }),
                ...(breakMinutes !== undefined && { breakMinutes }),
                ...(hours !== undefined && { hours }),
                ...(note !== undefined && { note })
            }
        })

        // Update overtime balance and vacation days
        await updateOvertimeBalance(entry.userId)
        await updateVacationDays(entry.userId)

        return NextResponse.json(entry)
    } catch (error) {
        console.error('Error updating time entry:', error)
        return NextResponse.json({ error: 'Error updating time entry' }, { status: 500 })
    }
}

// DELETE: Delete a time entry
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        const entry = await prisma.timeEntry.delete({
            where: { id }
        })

        // Update overtime balance and vacation days
        await updateOvertimeBalance(entry.userId)
        await updateVacationDays(entry.userId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting time entry:', error)
        return NextResponse.json({ error: 'Error deleting time entry' }, { status: 500 })
    }
}

// Helper: Calculate and update overtime balance
async function updateOvertimeBalance(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { timeEntries: true }
    })

    if (!user) return

    const dailyTarget = user.weeklyHours / 5

    let totalWorked = 0
    let totalExpected = 0

    const startDate = user.startDate
    const today = new Date()

    // Count work days since start
    let currentDate = new Date(startDate)
    while (currentDate <= today) {
        const dayOfWeek = currentDate.getDay()
        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalExpected += dailyTarget

            // Find entry for this day
            const entry = user.timeEntries.find(e => {
                const entryDate = new Date(e.date)
                return entryDate.toDateString() === currentDate.toDateString()
            })

            if (entry) {
                if (entry.type === 'work' && entry.hours) {
                    totalWorked += entry.hours
                } else if (entry.type === 'vacation' || entry.type === 'sick' || entry.type === 'holiday') {
                    // Full day or half day
                    const hoursToAdd = entry.halfDay ? dailyTarget / 2 : dailyTarget
                    totalWorked += hoursToAdd
                } else if (entry.type === 'overtime_reduction') {
                    // Überstunden abbauen - counts as worked but reduces expected
                    const hoursToAdd = entry.halfDay ? dailyTarget / 2 : dailyTarget
                    totalWorked += hoursToAdd
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1)
    }

    const overtimeBalance = totalWorked - totalExpected

    // NO LIMITS - just save the actual balance
    await prisma.user.update({
        where: { id: userId },
        data: { overtimeBalance }
    })
}

// Helper: Calculate and update vacation days used
async function updateVacationDays(userId: string) {
    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear + 1, 0, 0)

    const vacationEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            type: 'vacation',
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    })

    let usedDays = 0
    for (const entry of vacationEntries) {
        if (entry.halfDay) {
            usedDays += 0.5
        } else {
            usedDays += 1.0
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { vacationDaysUsed: usedDays }
    })
}
