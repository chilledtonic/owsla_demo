"use client"

import { useMemo } from "react"
import { 
  BookCoverData, 
  selectPalette, 
  selectTypography, 
  selectPattern, 
  formatAuthorName, 
  breakTitleIntoLines, 
  generatePatternSVG
} from "@/lib/cover-utils"

interface GeneratedBookCoverProps {
  book: BookCoverData
  className?: string
  showPattern?: boolean
  showGradient?: boolean
}

export function GeneratedBookCover({ 
  book, 
  className = "h-32 w-24", 
  showPattern = true,
  showGradient = false 
}: GeneratedBookCoverProps) {
  
  const coverData = useMemo(() => {
    const palette = selectPalette(book)
    const typography = selectTypography(book.title)
    const pattern = selectPattern(book)
    const titleLines = breakTitleIntoLines(book.title, 18)
    const authorName = formatAuthorName(book.author)
    
    return {
      palette,
      typography,
      pattern,
      titleLines,
      authorName
    }
  }, [book])

  const { palette, typography, pattern, titleLines, authorName } = coverData

  // Calculate responsive sizing
  const width = 192  // Standard book width
  const height = 288 // Standard book height (4:3 ratio)
  
  // Determine if we should use smaller font for long titles
  const adjustedFontSize = titleLines.length > 3 ? typography.size * 0.8 : typography.size
  const lineHeight = adjustedFontSize * typography.lineHeight

  return (
    <div className={`${className} relative overflow-hidden rounded-sm shadow-sm`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* Background */}
        <rect 
          width="100%" 
          height="100%" 
          fill={showGradient ? 'url(#gradient)' : palette.primary}
        />
        
        {/* Gradient definition */}
        {showGradient && (
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: palette.primary }} />
              <stop offset="100%" style={{ stopColor: palette.secondary }} />
            </linearGradient>
          </defs>
        )}
        
        {/* Pattern overlay */}
        {showPattern && pattern !== 'minimal' && (
          <>
            <defs dangerouslySetInnerHTML={{ 
              __html: generatePatternSVG(pattern, width, height, palette.accent).replace('<defs>', '').replace('</defs>', '')
            }} />
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </>
        )}
        
        {/* Decorative border */}
        <rect 
          x="8" 
          y="8" 
          width={width - 16} 
          height={height - 16} 
          fill="none" 
          stroke={palette.accent} 
          strokeWidth="1" 
          opacity="0.3"
        />
        
        {/* Title area background */}
        <rect 
          x="16" 
          y="24" 
          width={width - 32} 
          height={titleLines.length * lineHeight + 24} 
          fill={palette.secondary} 
          opacity="0.15" 
          rx="4"
        />
        
        {/* Title text */}
        {titleLines.map((line, index) => (
          <text 
            key={index}
            x={width / 2} 
            y={50 + (index * lineHeight)} 
            textAnchor="middle" 
            fill={palette.text} 
            fontSize={adjustedFontSize} 
            fontWeight={typography.weight}
            opacity="0.95"
          >
            {line}
          </text>
        ))}
        
        {/* Author name */}
        {authorName && (
          <text 
            x={width / 2} 
            y={height - 40} 
            textAnchor="middle" 
            fill={palette.text} 
            fontSize="14" 
            fontWeight="400"
            opacity="0.8"
          >
            {authorName}
          </text>
        )}
        
        {/* Year badge */}
        {book.year && (
          <>
            <rect 
              x={width - 50} 
              y="16" 
              width="40" 
              height="20" 
              fill={palette.accent} 
              opacity="0.8" 
              rx="2"
            />
            <text 
              x={width - 30} 
              y="29" 
              textAnchor="middle" 
              fill={palette.text} 
              fontSize="11" 
              fontWeight="500"
            >
              {book.year}
            </text>
          </>
        )}
        
        {/* Subtle accent line */}
        <line 
          x1="24" 
          x2={width - 24} 
          y1={height - 60} 
          y2={height - 60} 
          stroke={palette.accent} 
          strokeWidth="2" 
          opacity="0.4"
        />
      </svg>
    </div>
  )
} 