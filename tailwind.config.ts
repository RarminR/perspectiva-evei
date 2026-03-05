import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: {
            DEFAULT: '#51087e',
            dark: '#2c0246',
          },
          magenta: {
            DEFAULT: '#a007dc',
          },
          neutral: {
            lightest: '#eee',
            light: '#aaa',
            DEFAULT: '#666',
            dark: '#444',
            darker: '#222',
            darkest: '#111',
          },
          success: '#027a48',
          error: '#b42318',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
