import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3D7A6B',
          hover:   '#2F6356',
          press:   '#244F45',
          soft:    '#E4EFEB',
          softer:  '#F1F7F4',
          ink:     '#1F4A41',
        },
        danger: {
          DEFAULT: '#E5544A',
          soft:    '#FDECEA',
        },
        gray: {
          50:  '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 10px — 배지·타임스탬프
        'caption2': ['10px', { lineHeight: '1.4', letterSpacing: '0' }],
        // 11px — 탭 라벨·칩
        'caption':  ['11px', { lineHeight: '1.45', letterSpacing: '0' }],
        // 12px — 보조 레이블
        'label':    ['12px', { lineHeight: '1.45', letterSpacing: '0' }],
        // 13px — 보조 본문·날짜
        'body2':    ['13px', { lineHeight: '1.5', letterSpacing: '0' }],
        // 14px — 기본 본문
        'body':     ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        // 15px — 강조 본문·버튼
        'callout':  ['15px', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        // 16px — 카드 강조
        'subhead':  ['16px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        // 18px — 섹션 제목
        'title3':   ['18px', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        // 22px — 페이지 제목
        'title':    ['22px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        // 32px — 히어로 숫자
        'hero':     ['32px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
      },
      fontWeight: {
        regular:   '400',
        medium:    '500',
        semibold:  '600',
        bold:      '700',
        extrabold: '800',
      },
      borderRadius: {
        'sm':   '8px',
        'md':   '10px',
        'lg':   '14px',
        'xl':   '18px',
        '2xl':  '24px',
        'pill': '999px',
      },
      letterSpacing: {
        'tight':  '-0.015em',
        'tighter': '-0.02em',
      },
      boxShadow: {
        'focus': '0 0 0 4px rgba(61, 122, 107, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
