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
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm':   '8px',
        'md':   '10px',
        'lg':   '14px',
        'xl':   '18px',
        '2xl':  '24px',
        'pill': '999px',
      },
      boxShadow: {
        'focus': '0 0 0 4px rgba(61, 122, 107, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
