/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f6e56',
          tint: '#eaf3de',
          soft: '#2d8a72',
        },
        accent: {
          DEFAULT: '#ba7517',
          tint: '#faeeda',
        },
        danger: {
          DEFAULT: '#a32d2d',
          tint: '#faece7',
        },
        teal: {
          DEFAULT: '#0d7377',
          tint: '#e6f4f4',
        },
        background: '#f1efe8',
        surface: '#ffffff',
        text: {
          DEFAULT: '#2c2c2a',
          muted: '#5f5e5a',
          subtle: '#888780',
        },
      },
    },
  },
  plugins: [],
};
