import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { email, password, firstName, lastName } = await request.json()

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Alle Pflichtfelder müssen ausgefüllt werden' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ein Benutzer mit dieser Email existiert bereits' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'EMPLOYEE', // Default role
                weeklyHours: 40, // Default 40h/week
                overtimeBalance: 0,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
            }
        })

        return NextResponse.json(
            {
                message: 'Benutzer erfolgreich erstellt',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        )
    }
}
