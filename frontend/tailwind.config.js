export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                canvas: 'var(--color-canvas)',
                panel: 'var(--color-panel)',
                ink: 'var(--color-ink)',
                muted: 'var(--color-muted)',
                line: 'var(--color-line)',
                accent: 'var(--color-accent)',
                accentSoft: 'var(--color-accent-soft)',
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                danger: 'var(--color-danger)',
            },
            boxShadow: {
                panel: '0 10px 30px rgba(15, 23, 42, 0.05)',
            },
            borderRadius: {
                panel: '18px',
            },
            fontFamily: {
                sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
