// ============ 图片识图：将复盘截图 / 链接转为结构化复盘 JSON ============
// 通过任意 OpenAI 兼容的 vision 接口（chat/completions）识别图片，
// 要求模型输出符合 BotCReplayRecord 结构的纯 JSON，供 importJSON 自动载入。

export interface VisionConfig {
  baseUrl: string // 如 https://api.openai.com/v1
  apiKey: string
  model: string // 需支持视觉输入的模型
}

const SYSTEM_PROMPT = `你是《血染钟楼》(Blood on the Clocktower) 的复盘数据提取助手。
请仔细阅读图中内容，将其整理为一份「复盘 JSON」，严格输出符合下面 TypeScript 结构的纯 JSON 对象（不要输出任何解释、注释或 Markdown 代码块标记，只输出 JSON 本身）：

interface BotCReplayRecord {
  meta: { title: string; storyteller?: string; date?: string; winner: "good" | "evil" | "storyteller" | "custom"; winningReason?: string; mvp?: string }
  scriptMeta: { scriptName: string; author?: string; version?: string }
  evilSetup: { demonBluffs: string[]; evilKnowledgeNotes?: string }
  customGlossary: { tag: string; color: string; description?: string }[]
  customSections?: { title: string; content: string }[]
  specialRoles?: { id: string; category: "fabled" | "traveler"; name: string; nameEn?: string }[]
  initialPlayers: { seatNumber: number; name: string; realCharacter: string; fakeCharacter?: string; isAlive: boolean; hasGhostVote: boolean; activeTokens: { id: string; label: string; type: string; color?: string }[]; customTags?: string[] }[]
  phases: { id: string; phaseType: "night" | "day"; phaseNumber: number; title: string; logs: { id: string; type?: "st_action" | "info" | "player_speech" | "nomination" | "execution" | "attack" | "death" | "comment" | "custom"; sourceSeat?: number; targetSeats?: number[]; characterName?: string; content: string; customTag?: string; votes?: string }[] }[]
}

规则：
1. 若图中信息不完整，用合理推断补全，但不要虚构不存在的关键事实。
2. winner 默认 "good"，若图中能看出胜负则按实际填写。
3. 玩家角色名请保留中文，若图中有英文角色名，翻译为中文常用名（如 Washerwoman→洗衣妇）。
4. 阶段日志按「第 N 夜 / 第 N 天」顺序整理，log 的 content 用自然语言描述。
5. 颜色 color 用 #RRGGBB 十六进制。`

/** 从模型返回文本中提取首个 JSON 对象（自动剥离 Markdown 代码块） */
export function extractJSON(text: string): string {
  let s = text.trim()
  // 去掉 ```json ... ``` 围栏
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  // 找到第一个 { 与最后一个 }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return s
  return s.slice(start, end + 1)
}

/** 调用 OpenAI 兼容 vision 接口识别复盘图片，返回模型原始文本 */
export async function recognizeReplayImage(
  image: { url?: string; dataUrl?: string },
  config: VisionConfig,
): Promise<string> {
  const base = config.baseUrl.replace(/\/+$/, '')
  const endpoint = `${base}/chat/completions`

  const content: unknown[] = [{ type: 'text', text: SYSTEM_PROMPT }]
  if (image.url) content.push({ type: 'image_url', image_url: { url: image.url } })
  else if (image.dataUrl) content.push({ type: 'image_url', image_url: { url: image.dataUrl } })
  else throw new Error('未提供图片')

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content }],
      temperature: 0.2,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`识别接口错误 ${res.status}${errText ? `：${errText.slice(0, 300)}` : ''}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data?.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) throw new Error('识别结果为空')
  return text
}
