import { useState } from 'react'
import type { ScriptCharacter } from '../../types'
import { teamColor, teamTextColor, type Team } from '../../lib/script'

interface CharacterIconProps {
  name?: string
  image?: string // 已代理的图片 URL
  team: Team
  size: number
  dead?: boolean
  ringColor?: string
  shape?: 'circle' | 'square'
  bordered?: boolean // 是否绘制外边框（token 内图标设为 false）
  borderWidth?: number // 边框粗细（px），默认 2
}

// 角色肖像令牌，图片加载失败时回退到阵营色 + 首字
// shape="square" 复刻 townsquare 方形 token 美术
export default function CharacterIcon({ name, image, team, size, dead, ringColor, shape = 'circle', bordered = true, borderWidth = 2 }: CharacterIconProps) {
  const [failed, setFailed] = useState(false)
  const col = ringColor ?? teamColor(team)
  const textCol = teamTextColor(team)
  const fontSize = Math.max(size * 0.42, 11)
  const radius = shape === 'square' ? Math.round(size * 0.16) : '9999px'
  // 光晕 / 内阴影按尺寸等比缩放，避免小图标（时间线）被阴影盖满导致图像看不清
  const glow = Math.max(Math.round(size * 0.12), 2)
  const bevel = Math.max(1, Math.round(size * 0.02)) // 上缘高光厚度，营造 token 立体质感

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          // 参照 townsquare 的中性暗色「徽章/皮面」底，与阵营无关；阵营色仅由外环与光晕表达
          'radial-gradient(circle at 50% 30%, #3b332a 0%, #251f18 55%, #131009 100%)',
        border: bordered ? `${borderWidth}px solid ${col}` : 'none',
        boxShadow: bordered ? `0 0 ${glow}px ${col}55` : 'none',
        opacity: dead ? 0.55 : 1,
      }}
    >
      {image && !failed ? (
        <img
          src={image}
          alt={name}
          crossOrigin="anonymous"
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{ filter: dead ? 'grayscale(0.9) brightness(0.7)' : undefined }}
        />
      ) : (
        <span
          className="font-display font-bold leading-none"
          style={{ color: textCol, fontSize }}
        >
          {name?.slice(0, 1) ?? '?'}
        </span>
      )}

      {/* 立体质感：上缘高光 + 下缘暗影 + 细内描边，叠在肖像之上（参照 townsquare token 美术） */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow: `inset 0 ${bevel}px ${bevel * 2}px rgba(255,255,255,0.22), inset 0 -${bevel}px ${bevel * 2}px rgba(0,0,0,0.42), inset 0 0 0 ${Math.max(1, Math.round(size * 0.01))}px rgba(0,0,0,0.16)`,
        }}
      />
    </div>
  )
}
