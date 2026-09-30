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
          hover: '#2F6356',
          press: '#244F45',
          soft: '#E4EFEB',
          softer: '#F1F7F4',
          ink: '#1F4A41',
          // 시간 면(時面)의 바탕. brand.ink보다 더 내려간 진한 초록으로, 흰 숫자가
          // 울릴 만큼의 대비를 만든다. 이 앱에서 과감함을 쓰는 유일한 자리다.
          ground: '#14332C',
        },
        // 변경·확인 필요를 알리는 색. 지금까지 일정 변경을 danger(빨강)로 표시했는데
        // 재조정은 오류가 아니다 — 주의는 끌되 잘못됐다고 말하지 않는 온도가 필요하다.
        signal: {
          DEFAULT: '#B5761F',
          soft: '#FBF1E0',
          ink: '#7A4E11',
        },
        danger: {
          DEFAULT: '#E5544A',
          soft: '#FDECEA',
          // 본문 크기 텍스트용 — DEFAULT(#E5544A)는 흰 배경 대비 3.69:1로 WCAG AA(4.5:1) 미달
          strong: '#C23B32',
        },
        gray: {
          50: '#F9FAFB',
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
        sans: [
          'var(--font-pretendard)',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        // 10px — 배지·타임스탬프
        caption2: ['10px', { lineHeight: '1.4', letterSpacing: '0' }],
        // 11px — 탭 라벨·칩
        caption: ['11px', { lineHeight: '1.45', letterSpacing: '0' }],
        // 12px — 보조 레이블
        label: ['12px', { lineHeight: '1.45', letterSpacing: '0' }],
        // 13px — 보조 본문·날짜
        body2: ['13px', { lineHeight: '1.5', letterSpacing: '0' }],
        // 14px — 기본 본문
        body: ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        // 15px — 강조 본문·버튼
        callout: ['15px', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        // 16px — 카드 강조
        subhead: ['16px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        // 18px — 섹션 제목
        title3: ['18px', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        // 22px — 페이지 제목
        title: ['22px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        // 32px — 히어로 숫자
        hero: ['32px', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        // --- 시간 축(時間軸) ---
        // 이 제품의 표시용 목소리. 별도 서체를 들이지 않고 Pretendard Variable 의
        // 축(45~920)을 끝까지 써서 성격을 낸다 — 학부모가 폰으로 흘끗 보는 유틸리티에
        // 두 번째 서체는 장식이 되고, 한글 본문과 라틴 숫자의 베이스라인도 어긋난다.
        // 48px — 다음 수업 시각. 화면에서 가장 큰 것이 항상 "시각"이어야 한다.
        time: ['48px', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
        // 20px — 목록 행의 시각
        'time-row': ['20px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        // 11px — 요일·구분 라벨. 자간을 벌려 시각(붙임)과 대비시킨다.
        eyebrow: ['11px', { lineHeight: '1.3', letterSpacing: '0.08em' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        pill: '999px',
      },
      letterSpacing: {
        tight: '-0.015em',
        tighter: '-0.02em',
      },
      boxShadow: {
        focus: '0 0 0 4px rgba(61, 122, 107, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
