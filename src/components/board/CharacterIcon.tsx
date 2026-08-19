import { useState } from 'react'
import type { ScriptCharacter } from '../../types'
import { teamColor, teamTextColor, isEvil, type Team } from '../../lib/script'

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
  const inset = Math.max(Math.round(size * 0.1), 1)

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: isEvil(team)
          ? 'radial-gradient(circle at 50% 35%, #3a1416 0%, #160a0c 100%)'
          : 'radial-gradient(circle at 50% 35%, #1a2740 0%, #0a1118 100%)',
        border: bordered ? `${borderWidth}px solid ${col}` : 'none',
        boxShadow: bordered ? `0 0 ${glow}px ${isEvil(team) ? 'rgba(192,57,43,0.45)' : 'rgba(79,134,198,0.35)'}, inset 0 0 ${inset}px rgba(0,0,0,0.5)` : 'none',
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
    </div>
  )
}
