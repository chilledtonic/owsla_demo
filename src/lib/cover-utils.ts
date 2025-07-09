export interface BookCoverData {
  title: string
  author?: string
  isbn?: string
  year?: number
  genre?: string
}

// Color palettes inspired by Standard Ebooks
export const COVER_PALETTES = [
  // Classic Literature
  { primary: '#2D3748', secondary: '#E2E8F0', accent: '#D69E2E', text: '#FFFFFF' },
  // Science Fiction
  { primary: '#1A202C', secondary: '#4A5568', accent: '#63B3ED', text: '#F7FAFC' },
  // Philosophy
  { primary: '#744210', secondary: '#FBD38D', accent: '#B7791F', text: '#FFFFFF' },
  // History
  { primary: '#742A2A', secondary: '#FED7D7', accent: '#E53E3E', text: '#FFFFFF' },
  // Natural Sciences
  { primary: '#22543D', secondary: '#C6F6D5', accent: '#38A169', text: '#FFFFFF' },
  // Art & Design
  { primary: '#553C9A', secondary: '#E9D8FD', accent: '#9F7AEA', text: '#FFFFFF' },
  // Economics
  { primary: '#2D3748', secondary: '#CBD5E0', accent: '#4299E1', text: '#FFFFFF' },
  // Technology
  { primary: '#1A365D', secondary: '#BEE3F8', accent: '#3182CE', text: '#FFFFFF' },
  // Psychology
  { primary: '#97266D', secondary: '#FBB6CE', accent: '#D53F8C', text: '#FFFFFF' },
  // Modern Literature
  { primary: '#2A4365', secondary: '#BEE3F8', accent: '#3182CE', text: '#FFFFFF' },
  // Mathematics
  { primary: '#1A202C', secondary: '#E2E8F0', accent: '#F6AD55', text: '#FFFFFF' },
  // Biography
  { primary: '#744210', secondary: '#FEEBC8', accent: '#DD6B20', text: '#FFFFFF' }
]

// Typography scales for different title lengths
export const TYPOGRAPHY_SCALES = {
  veryShort: { size: 28, lineHeight: 1.1, weight: '700' }, // 1-15 chars
  short: { size: 24, lineHeight: 1.2, weight: '600' },     // 16-30 chars
  medium: { size: 20, lineHeight: 1.3, weight: '600' },    // 31-50 chars
  long: { size: 18, lineHeight: 1.3, weight: '500' },      // 51-70 chars
  veryLong: { size: 16, lineHeight: 1.4, weight: '500' }   // 70+ chars
}

// Geometric patterns for visual interest
export const COVER_PATTERNS = [
  'vertical-lines',
  'horizontal-lines', 
  'diagonal-lines',
  'grid',
  'circles',
  'triangles',
  'hexagons',
  'waves',
  'dots',
  'minimal'
] as const

export type CoverPattern = typeof COVER_PATTERNS[number]

/**
 * Generate a deterministic hash from a string
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Select a color palette based on book metadata
 */
export function selectPalette(book: BookCoverData): typeof COVER_PALETTES[0] {
  // Use title and author for deterministic selection
  const seedText = `${book.title}${book.author || ''}${book.isbn || ''}`
  const hash = simpleHash(seedText)
  return COVER_PALETTES[hash % COVER_PALETTES.length]
}

/**
 * Select typography based on title length
 */
export function selectTypography(title: string): typeof TYPOGRAPHY_SCALES.short {
  const length = title.length
  
  if (length <= 15) return TYPOGRAPHY_SCALES.veryShort
  if (length <= 30) return TYPOGRAPHY_SCALES.short
  if (length <= 50) return TYPOGRAPHY_SCALES.medium
  if (length <= 70) return TYPOGRAPHY_SCALES.long
  return TYPOGRAPHY_SCALES.veryLong
}

/**
 * Select a pattern for the cover background
 */
export function selectPattern(book: BookCoverData): CoverPattern {
  const seedText = `${book.title}${book.year || ''}`
  const hash = simpleHash(seedText)
  return COVER_PATTERNS[hash % COVER_PATTERNS.length]
}

/**
 * Format author name for display
 */
export function formatAuthorName(author: string | undefined): string {
  if (!author) return ''
  
  // Handle "Last, First" format
  if (author.includes(',')) {
    const [last, first] = author.split(',').map(s => s.trim())
    return `${first} ${last}`
  }
  
  return author
}

/**
 * Break title into lines for better layout
 */
export function breakTitleIntoLines(title: string, maxCharsPerLine: number = 20): string[] {
  const words = title.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, just add it
        lines.push(word)
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Generate SVG path data for patterns
 */
export function generatePatternSVG(pattern: CoverPattern, width: number, height: number, color: string): string {
  const opacity = '0.1'
  
  switch (pattern) {
    case 'vertical-lines':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="20" height="100%" patternUnits="userSpaceOnUse">
          <line x1="10" y1="0" x2="10" y2="100%" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'horizontal-lines':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="100%" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="100%" y2="10" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'diagonal-lines':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="20" x2="20" y2="0" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'grid':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'circles':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="8" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'triangles':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
          <polygon points="15,2 28,24 2,24" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'hexagons':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="40" height="35" patternUnits="userSpaceOnUse">
          <polygon points="20,2 35,12 35,23 20,33 5,23 5,12" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'waves':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
          <path d="M0,10 Q15,0 30,10 T60,10" fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'dots':
      return `<defs>
        <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="${color}" opacity="${opacity}"/>
        </pattern>
      </defs>`
      
    case 'minimal':
    default:
      return ''
  }
}

/**
 * Generate a deterministic gradient for more visual interest
 */
export function generateGradient(book: BookCoverData, palette: typeof COVER_PALETTES[0]): string {
  const seedText = `${book.title}${book.author || ''}`
  const hash = simpleHash(seedText)
  
  // Determine gradient direction
  const directions = ['45deg', '135deg', '90deg', '180deg']
  const direction = directions[hash % directions.length]
  
  // Use primary and secondary colors from palette
  return `linear-gradient(${direction}, ${palette.primary}, ${palette.secondary})`
} 