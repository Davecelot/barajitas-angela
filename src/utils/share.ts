import type { Sticker, Team } from '../data/album'

export function formatMissing(teams: Team[], collected: Set<string>): string {
  const sections = teams
    .map((team) => {
      const missing = team.stickers.filter((sticker) => !collected.has(sticker.id))
      if (missing.length === 0) return null

      const stickers = missing
        .map((sticker) => `#${sticker.number} ${sticker.name}`)
        .join(', ')

      return `${team.flag} ${team.name}\n  ${stickers}`
    })
    .filter((section): section is string => section !== null)

  return ['*Barajitas que me faltan* ⚽', ...sections].join('\n\n')
}

export function formatRepeated(
  teams: Team[],
  specialStickers: Sticker[],
  repeated: Record<string, number>,
): string {
  const specialEntries = specialStickers
    .filter((sticker) => (repeated[sticker.id] ?? 0) > 0)
    .map((sticker) => `#${sticker.number} ${sticker.name} (+${repeated[sticker.id]})`)

  const specialSection = specialEntries.length > 0
    ? [`Especiales\n  ${specialEntries.join(', ')}`]
    : []

  const teamSections = teams
    .map((team) => {
      const stickers = team.stickers
        .filter((sticker) => (repeated[sticker.id] ?? 0) > 0)
        .map((sticker) => `#${sticker.number} ${sticker.name} (+${repeated[sticker.id]})`)

      if (stickers.length === 0) return null

      return `${team.flag} ${team.name}\n  ${stickers.join(', ')}`
    })
    .filter((section): section is string => section !== null)

  return ['*Barajitas repetidas para cambiar* 🔁', ...specialSection, ...teamSections].join('\n\n')
}
