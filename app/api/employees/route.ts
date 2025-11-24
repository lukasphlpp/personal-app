import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                weeklyHours: true,
                overtimeBalance: true,
                color: true,
                startDate: true,
            },
            orderBy: {
                employeeId: 'asc'
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching employees' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { employeeId, firstName, lastName, email, role, weeklyHours, color, startDate } = body

        // Check if employeeId already exists
        const existingEmployee = await prisma.user.findUnique({
            where: { employeeId }
        })

        if (existingEmployee) {
            return NextResponse.json({ error: 'Personalnummer bereits vergeben' }, { status: 400 })
        }

        // If email is provided, check if it exists
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email }
            })
            if (existingEmail) {
                return NextResponse.json({ error: 'Email bereits vergeben' }, { status: 400 })
            }
        }

        const user = await prisma.user.create({
            data: {
                employeeId,
                firstName,
                lastName,
                email: email || null,
                password: null, // No password for employees without login
                role: role || 'EMPLOYEE',
                weeklyHours: weeklyHours || 40,
                overtimeBalance: 0,
                color: color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                startDate: startDate ? new Date(startDate) : new Date(),
            }
        })

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword, { status: 201 })
    } catch (error) {
        console.error('Error creating employee:', error)
        return NextResponse.json({ error: 'Error creating employee' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, employeeId, firstName, lastName, email, role, weeklyHours, color, startDate } = body

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        // Check if new employeeId conflicts
        if (employeeId) {
            const existing = await prisma.user.findFirst({
                where: {
                    employeeId,
                    NOT: { id }
                }
            })
            if (existing) {
                return NextResponse.json({ error: 'Personalnummer bereits vergeben' }, { status: 400 })
            }
        }

        // Check if new email conflicts
        if (email) {
            const existing = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id }
                }
            })
            if (existing) {
                return NextResponse.json({ error: 'Email bereits vergeben' }, { status: 400 })
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(employeeId && { employeeId }),
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(email !== undefined && { email: email || null }),
                ...(role && { role }),
                ...(weeklyHours !== undefined && { weeklyHours }),
                ...(color && { color }),
                ...(startDate && { startDate: new Date(startDate) }),
            }
        })

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error('Error updating employee:', error)
        return NextResponse.json({ error: 'Error updating employee' }, { status: 500 })
    }
}
