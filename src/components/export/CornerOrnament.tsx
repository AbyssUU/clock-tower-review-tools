interface CornerOrnamentProps {
  position: 'tl' | 'tr' | 'bl' | 'br'
  size?: number
}

// 黄铜花式角饰（SVG）
export default function CornerOrnament({ position, size = 72 }: CornerOrnamentProps) {
  const rotate = { tl: 0, tr: 90, br: 180, bl: 270 }[position]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)`, transformOrigin: '36px 36px' }}
    >
      {/* 双线拐角 */}
      <path d="M4 68 V16 Q4 4 16 4 H68" stroke="#C9A227" strokeWidth="2.2" opacity="0.85" />
      <path d="M11 68 V22 Q11 11 22 11 H68" stroke="#96690D" strokeWidth="1" opacity="0.6" />
      {/* 内角菱形 */}
      <rect x="14" y="14" width="9" height="9" transform="rotate(45 18.5 18.5)" fill="#C9A227" opacity="0.9" />
      {/* 末端小圆 */}
      <circle cx="4" cy="68" r="2.6" fill="#D4AF37" />
      <circle cx="68" cy="4" r="2.6" fill="#D4AF37" />
      {/* 卷草纹 */}
      <path d="M28 28 Q38 20 34 12 Q30 6 24 9" stroke="#C9A227" strokeWidth="1.4" fill="none" opacity="0.55" />
      <circle cx="24" cy="9" r="1.6" fill="#D4AF37" opacity="0.7" />
    </svg>
  )
}
