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
            DEFAULT: '#2D1B69',
            dark: '#1A0F3D',
            light: '#4A2FA0',
          },
          pink: {
            DEFAULT: '#E91E8C',
            light: '#F472B6',
            rose: '#FDA4AF',
          },
          desert: {
            DEFAULT: '#C4956A',
            light: '#E8C9A0',
          },
          'light-pink': '#FDF2F8',
        },
      },
    },
  },
  plugins: [],
}
export default config
