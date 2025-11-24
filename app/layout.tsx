import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Time Tracking - Mitarbeiterverwaltung',
    description: 'Moderne Zeiterfassung und Mitarbeiterverwaltung',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="de">
            <body className={inter.className}>
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    )
}
