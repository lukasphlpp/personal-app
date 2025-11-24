export { default } from 'next-auth/middleware'

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/employees/:path*',
        '/calendar/:path*',
        '/reports/:path*',
        '/settings/:path*',
    ]
}
