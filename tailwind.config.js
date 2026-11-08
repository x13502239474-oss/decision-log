/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#171512',
          800: '#211D18',
          700: '#393127',
          600: '#4A4034',
        },
        paper: {
          kraft: '#D7C5A5',
          old: '#E8DCC4',
          yellow: '#CBB58F',
          fresh: '#F2F0EA',
        },
        text: {
          light: '#E9E0D1',
          dark: '#392F24',
          muted: '#A99A82',
        },
        gold: '#B69A67',
        stamp: '#A65C4B',
        due: '#C47A54',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', '"Libre Baskerville"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', '"SFMono-Regular"', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(0,0,0,.28), 0 8px 24px -8px rgba(0,0,0,.55), 0 20px 48px -20px rgba(0,0,0,.6)',
        'paper-sm': '0 1px 2px rgba(0,0,0,.25), 0 6px 16px -6px rgba(0,0,0,.5)',
        inset: 'inset 0 0 0 1px rgba(255,255,255,.16), inset 0 -12px 30px rgba(80,60,35,.09)',
      },
      maxWidth: {
        archive: '1180px',
      },
    },
  },
  plugins: [],
}
