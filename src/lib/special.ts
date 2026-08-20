import type { SpecialRoleEntry } from '../types'
import { proxiedImage } from './proxy'

// ============ 传奇角色（Fabled）与奇遇角色（Travelers）目录 ============
// 名称与图标取自 bra1n/townsquare 源码（src/fabled.json、src/roles.json、src/assets/icons/*.png）
// 图标经跨域图片代理（lib/proxy.ts）访问，保证 html-to-image 导出可内联跨域图片。

const TS_ICON = (id: string) =>
  `https://raw.githubusercontent.com/bra1n/townsquare/main/src/assets/icons/${id}.png`

export interface SpecialCatalogItem {
  id: string
  nameEn: string
  name: string
  image: string
}

// 传奇角色（Fabled）—— 说书人助手，不占玩家席位
export const FABLED_CATALOG: SpecialCatalogItem[] = [
  { id: 'doomsayer', nameEn: 'Doomsayer', name: '末日使者', image: TS_ICON('doomsayer') },
  { id: 'angel', nameEn: 'Angel', name: '天使', image: TS_ICON('angel') },
  { id: 'buddhist', nameEn: 'Buddhist', name: '僧侣', image: TS_ICON('buddhist') },
  { id: 'hellslibrarian', nameEn: "Hell's Librarian", name: '地狱图书管理员', image: TS_ICON('hellslibrarian') },
  { id: 'revolutionary', nameEn: 'Revolutionary', name: '革命者', image: TS_ICON('revolutionary') },
  { id: 'fiddler', nameEn: 'Fiddler', name: '提琴手', image: TS_ICON('fiddler') },
  { id: 'toymaker', nameEn: 'Toymaker', name: '玩具匠', image: TS_ICON('toymaker') },
  { id: 'fibbin', nameEn: 'Fibbin', name: '费比恩', image: TS_ICON('fibbin') },
  { id: 'duchess', nameEn: 'Duchess', name: '女公爵', image: TS_ICON('duchess') },
  { id: 'sentinel', nameEn: 'Sentinel', name: '哨兵', image: TS_ICON('sentinel') },
  { id: 'spiritofivory', nameEn: 'Spirit of Ivory', name: '象牙之魂', image: TS_ICON('spiritofivory') },
  { id: 'djinn', nameEn: 'Djinn', name: '灯神', image: TS_ICON('djinn') },
  { id: 'stormcatcher', nameEn: 'Storm Catcher', name: '捕风者', image: TS_ICON('stormcatcher') },
]

// 奇遇角色（Travelers）—— 中后期可加入/离场的角色
export const TRAVELER_CATALOG: SpecialCatalogItem[] = [
  { id: 'bureaucrat', nameEn: 'Bureaucrat', name: '官僚', image: TS_ICON('bureaucrat') },
  { id: 'thief', nameEn: 'Thief', name: '窃贼', image: TS_ICON('thief') },
  { id: 'gunslinger', nameEn: 'Gunslinger', name: '神枪手', image: TS_ICON('gunslinger') },
  { id: 'scapegoat', nameEn: 'Scapegoat', name: '替罪羊', image: TS_ICON('scapegoat') },
  { id: 'beggar', nameEn: 'Beggar', name: '乞丐', image: TS_ICON('beggar') },
  { id: 'apprentice', nameEn: 'Apprentice', name: '学徒', image: TS_ICON('apprentice') },
  { id: 'matron', nameEn: 'Matron', name: '女总管', image: TS_ICON('matron') },
  { id: 'judge', nameEn: 'Judge', name: '法官', image: TS_ICON('judge') },
  { id: 'bishop', nameEn: 'Bishop', name: '主教', image: TS_ICON('bishop') },
  { id: 'voudon', nameEn: 'Voudon', name: '巫毒', image: TS_ICON('voudon') },
  { id: 'barista', nameEn: 'Barista', name: '咖啡师', image: TS_ICON('barista') },
  { id: 'harlot', nameEn: 'Harlot', name: '舞女', image: TS_ICON('harlot') },
  { id: 'butcher', nameEn: 'Butcher', name: '屠夫', image: TS_ICON('butcher') },
  { id: 'bonecollector', nameEn: 'Bone Collector', name: '收骨人', image: TS_ICON('bonecollector') },
  { id: 'deviant', nameEn: 'Deviant', name: '越轨者', image: TS_ICON('deviant') },
  { id: 'gangster', nameEn: 'Gangster', name: '黑帮', image: TS_ICON('gangster') },
]

export const SPECIAL_CATALOG: SpecialCatalogItem[] = [...FABLED_CATALOG, ...TRAVELER_CATALOG]

// 通过显示名 / 英文名 / id 在目录中查找角色
export function findSpecial(nameOrId?: string): SpecialCatalogItem | undefined {
  if (!nameOrId) return undefined
  const key = nameOrId.trim().toLowerCase()
  return SPECIAL_CATALOG.find(
    (c) => c.id === key || c.nameEn.toLowerCase() === key || c.name.toLowerCase() === key,
  )
}

// 解析传奇/奇遇角色的图标（优先自定义 image，其次目录图标）
export function specialImage(entry: SpecialRoleEntry): string | undefined {
  if (entry.image) return proxiedImage(entry.image)
  const hit = findSpecial(entry.nameEn) ?? findSpecial(entry.name) ?? findSpecial(entry.id)
  return hit ? proxiedImage(hit.image) : undefined
}

// 传奇/奇遇角色的阵营色（区别于标准阵营）
export function specialColor(category: SpecialRoleEntry['category']): string {
  return category === 'fabled' ? '#8E6BB8' : '#4FA8A0'
}

export function categoryLabel(category: SpecialRoleEntry['category']): string {
  return category === 'fabled' ? '传奇角色 · FABLED' : '奇遇角色 · TRAVELER'
}

export function categoryShort(category: SpecialRoleEntry['category']): string {
  return category === 'fabled' ? 'FABLED' : 'TRAVELER'
}
