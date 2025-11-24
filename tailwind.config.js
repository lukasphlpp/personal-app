/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#94a3b8',
                surface: '#1e293b',
                background: '#0f172a',
            },
        },
    },
    plugins: [],
}
