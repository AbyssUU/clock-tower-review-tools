/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 暗夜古堡背景
        abyss: {
          950: '#0D1117',
          900: '#161B22',
          850: '#1B212B',
          800: '#212836',
          700: '#2B3342',
        },
        // 暗金黄铜
        brass: {
          50: '#FBF3D5',
          100: '#F5E6B8',
          200: '#EBD28A',
          300: '#DDBB5F',
          400: '#D4AF37',
          500: '#C9A227',
          600: '#B8860B',
          700: '#96690D',
          800: '#6E4D12',
          900: '#4A330E',
        },
        // 羊皮纸（白天）
        parchment: {
          50: '#FBF6EA',
          100: '#F5EBD3',
          200: '#EBD9AF',
          300: '#DEC188',
          400: '#CDA665',
          500: '#B98D4A',
        },
        // 冷月深紫蓝（夜晚）
        moon: {
          950: '#0E1420',
          900: '#131B2B',
          800: '#1B2740',
          700: '#253359',
          600: '#33406E',
          500: '#4A5B93',
          400: '#6B7CB4',
        },
        // 阵营色
        good: {
          DEFAULT: '#4F86C6',
          light: '#7FACDB',
          dark: '#2C5A8C',
        },
        evil: {
          DEFAULT: '#B23A48',
          light: '#D47380',
          dark: '#7C2029',
        },
      },
      fontFamily: {
        // 英文/数字优先 Times New Roman，中文回退宋体；通过 CSS 变量支持单独调整
        display: ['var(--font-latin)', 'var(--font-cn)', 'Georgia', 'serif'],
        serif: ['var(--font-latin)', 'var(--font-cn)', 'Georgia', 'serif'],
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'brass-glow': '0 0 24px rgba(212, 175, 55, 0.28), 0 0 2px rgba(212, 175, 55, 0.6)',
        'brass-inner': 'inset 0 0 18px rgba(212, 175, 55, 0.18)',
        'evil-glow': '0 0 22px rgba(178, 58, 72, 0.35)',
        'good-glow': '0 0 22px rgba(79, 134, 198, 0.35)',
        'ember': '0 0 30px rgba(255, 140, 40, 0.25)',
      },
      backgroundImage: {
        'night-hall': 'linear-gradient(160deg, #0D1117 0%, #161B22 45%, #1B2740 100%)',
        'brass-grad': 'linear-gradient(135deg, #EBD28A 0%, #C9A227 45%, #96690D 100%)',
        'parchment-grad': 'linear-gradient(135deg, #FBF6EA 0%, #F0E1C0 60%, #DEC188 100%)',
        'ember-radial': 'radial-gradient(circle at 50% 50%, rgba(255,150,50,0.18), transparent 60%)',
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'spin-slower': 'spin 120s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'flicker': 'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.9' },
          '45%': { opacity: '0.65' },
          '55%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
