/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', faint: 'var(--ink-faint)' },
        line: { DEFAULT: 'var(--line)', soft: 'var(--line-soft)' },
        accent: { DEFAULT: 'var(--accent)', deep: 'var(--accent-deep)', wash: 'var(--accent-wash)' },
        secondary: { DEFAULT: 'var(--secondary)', wash: 'var(--secondary-wash)', ink: 'var(--secondary-ink)' },
        good: { DEFAULT: 'var(--good)', wash: 'var(--good-wash)' },
        warn: { DEFAULT: 'var(--warn)', wash: 'var(--warn-wash)' },
        crit: { DEFAULT: 'var(--crit)', wash: 'var(--crit-wash)' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Tajawal', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '14px' },
      boxShadow: { card: 'var(--shadow)' },
    },
  },
  plugins: [],
};
