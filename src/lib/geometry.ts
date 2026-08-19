// 魔典径向布局几何计算

export interface PolarPoint {
  x: number
  y: number
  angle: number // 弧度
  radius: number
}

export interface WheelConfig {
  size: number // 画布边长
  center: number // 圆心坐标（正方形画布）
  playerRadius: number // 玩家节点所在半径
  outerRadius: number // 装饰外环半径
}

export function makeWheelConfig(size = 1120): WheelConfig {
  const center = size / 2
  return {
    size,
    center,
    playerRadius: size * 0.375,
    outerRadius: size * 0.465,
  }
}

/** 从顶部（12 点钟方向）顺时针排列第 index 位玩家（index 0-based） */
export function playerPosition(cfg: WheelConfig, index: number, total: number): PolarPoint {
  const angleDeg = -90 + (index / total) * 360
  const angle = (angleDeg * Math.PI) / 180
  return {
    x: cfg.center + cfg.playerRadius * Math.cos(angle),
    y: cfg.center + cfg.playerRadius * Math.sin(angle),
    angle,
    radius: cfg.playerRadius,
  }
}

/** 辐射线上某比例位置（0=圆心，1=玩家节点） */
export function spokePoint(cfg: WheelConfig, polar: PolarPoint, t: number): { x: number; y: number } {
  return {
    x: cfg.center + (polar.x - cfg.center) * t,
    y: cfg.center + (polar.y - cfg.center) * t,
  }
}

/** 生成外环齿轮齿的 SVG path */
export function gearTeethPath(cfg: WheelConfig, teeth = 48, toothHeight = 16): string {
  const { center, outerRadius } = cfg
  const points: string[] = []
  const step = (Math.PI * 2) / teeth
  const inner = outerRadius - toothHeight
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step
    const a1 = a0 + step * 0.45 // 齿宽
    const a2 = a0 + step * 0.5
    const a3 = a0 + step
    const outer = (a: number) => `${center + outerRadius * Math.cos(a)},${center + outerRadius * Math.sin(a)}`
    const innerFn = (a: number) => `${center + inner * Math.cos(a)},${center + inner * Math.sin(a)}`
    if (i === 0) points.push(`M ${innerFn(a0)}`)
    points.push(`L ${outer(a0)} L ${outer(a1)} L ${innerFn(a2)} L ${innerFn(a3)}`)
  }
  return points.join(' ') + ' Z'
}

/** 呼吸光晕的渐变 ID（保证多实例不冲突） */
export const svgDefIds = {
  spokeGrad: 'spoke-grad',
  gearGrad: 'gear-grad',
  ringGrad: 'ring-grad',
  centerGlow: 'center-glow',
  nightGlow: 'night-glow',
}
