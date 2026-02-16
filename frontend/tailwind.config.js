/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                nexus: {
                    dark: '#0f172a',
                    accent: '#38bdf8',
                    danger: '#ef4444',
                    warn: '#f59e0b',
                    success: '#10b981',
                }
            }
        },
    },
    plugins: [],
}
