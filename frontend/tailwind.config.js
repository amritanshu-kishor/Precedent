/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm editorial canvas — clearly distinct surface hierarchy
        ivory: {
          50:  '#FFFFFF',   // Pure white — card / dossier surface
          100: '#F4EFE4',   // Warm canvas background (page ground)
          200: '#E6DFD0',   // Panel background, inset surfaces
          300: '#D6CCBB',   // Hover, selected row
          400: '#C2B99E',   // Accent border
          500: '#A89880',
        },
        // Nocturnal editorial — high surface separation
        obsidian: {
          50:  '#3A3D30',   // Visible dark border on dark card
          100: '#2E3127',
          200: '#252820',   // Hover / elevated state
          300: '#1C1F18',   // Input bg / sub-panel
          400: '#151812',   // Card / dossier surface
          500: '#0C0E09',   // Deep nocturnal ground
          600: '#090B07',
          700: '#070805',
          800: '#040504',
          900: '#020302',
        },
        // Primary ink — editorial black
        ink: {
          50:  '#F5F5F2',
          100: '#E8E8E3',
          200: '#CCCCC5',
          300: '#A5A49C',
          400: '#787770',
          500: '#57564F',
          600: '#3F3E37',
          700: '#2E2D27',
          800: '#1E1E18',  // Primary editorial ink
          900: '#131310',
          950: '#080806',
        },
        // Stone — neutral scale with high contrast secondary text
        stone: {
          50:  '#F8F7F4',
          100: '#EEECEA',
          200: '#D8D5CE',   // Light mode card border
          300: '#BCB9B2',   // Light mode structural separator
          400: '#8A8880',   // Light mode readable secondary text
          500: '#66645D',   // Light mode label / metadata
          600: '#4A4842',   // Light mode body text
          700: '#3A3D30',   // Dark mode border
          800: '#2A2D22',   // Dark mode hairline
          900: '#1A1D14',
        },
        // Muted brass — editorial gold accent
        brass: {
          50:  '#FDFCF8',
          100: '#F7F0E0',
          200: '#EDE0BE',
          300: '#DEC98E',
          400: '#D4AE62',   // Active dark mode accent
          500: '#B89040',   // Primary brass
          600: '#956F28',
          700: '#714F14',
          800: '#503808',
          900: '#382604',
        },
        // Crimson — critical alerts
        crimson: {
          50:  '#FDF3F3',
          100: '#FAE6E6',
          200: '#F4CCCC',
          300: '#E9A6A6',
          400: '#D96E6E',   // Dark mode alert
          500: '#BB3E3E',
          600: '#9E2424',
          700: '#841A1A',   // Light mode authoritative
          800: '#6B1515',
          900: '#571212',
        },
        // Forest green — compliance / verified
        forest: {
          50:  '#F2F8F5',
          100: '#E2F0E9',
          200: '#C5DECE',
          300: '#97C3A9',
          400: '#56A67A',   // Dark mode active forest
          500: '#3A8560',
          600: '#276944',
          700: '#1C5232',   // Light mode authoritative
          800: '#164027',
          900: '#11311E',
        },
        // Amber — warnings / pending
        amber: {
          50:  '#FDF9F0',
          100: '#F9EED8',
          200: '#F2DAAC',
          300: '#E8BE78',
          400: '#DFA444',   // Dark mode warning
          500: '#C4851E',
          600: '#9C6210',
          700: '#784A08',
          800: '#5A3605',
          900: '#3F2503',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono:  ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'fine':      '0 1px 2px 0 rgba(14, 14, 10, 0.06)',
        'editorial': '0 4px 16px -2px rgba(14, 14, 10, 0.08), 0 1px 3px rgba(14, 14, 10, 0.05)',
        'dossier':   '0 12px 32px -4px rgba(14, 14, 10, 0.14), 0 2px 6px rgba(14, 14, 10, 0.06)',
      }
    },
  },
  plugins: [],
}
