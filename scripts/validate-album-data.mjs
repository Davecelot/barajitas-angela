import fs from 'node:fs'

const albumSource = fs.readFileSync('src/data/album.ts', 'utf8')
const analysisSource = fs.readFileSync('docs/album-analysis.md', 'utf8')

const codeMap = {
  MEX: 'mex',
  RSA: 'rsa',
  KOR: 'kor',
  CZE: 'cze',
  CAN: 'can',
  BIH: 'bih',
  QAT: 'qat',
  SUI: 'sui',
  BRA: 'bra',
  SCO: 'sco',
  USA: 'usa',
  PAR: 'par',
  AUS: 'aus',
  TUR: 'tur',
  GER: 'ger',
  CUW: 'cuw',
  CIV: 'civ',
  JPN: 'jpn',
  TUN: 'tun',
  SWE: 'swe',
  BEL: 'bel',
  EGY: 'egy',
  IRN: 'irn',
  NZL: 'nzl',
  ESP: 'esp',
  CPV: 'cpv',
  JOR: 'jor',
  UZB: 'uzb',
  COL: 'col',
  POR: 'por',
  ENG: 'eng',
  CRO: 'cro',
  GHA: 'gha',
  PAN: 'pan',
}

const defaultBlock = albumSource.match(/defaultCollected = new Set<string>\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
const defaultCollected = new Set(
  [...defaultBlock.matchAll(/'((?:[a-z]{3}|fwc|cc)-\d+)'/g)].map((match) => match[1]),
)

const teamIds = new Set()
for (const teamMatch of albumSource.matchAll(/makeTeam\('([a-z]{3})'/g)) {
  const teamId = teamMatch[1]
  for (let number = 1; number <= 20; number += 1) {
    teamIds.add(`${teamId}-${number}`)
  }
}

const specialIds = new Set()
for (let number = 1; number <= 18; number += 1) specialIds.add(`fwc-${number}`)
for (let number = 1; number <= 14; number += 1) specialIds.add(`cc-${number}`)
const knownIds = new Set([...teamIds, ...specialIds])

const alreadyPlacedBlock =
  analysisSource.match(/## Already Placed([\s\S]*?)## Left To Be Placed/)?.[1] ?? ''
const documentedPlaced = new Set()
for (const placedMatch of alreadyPlacedBlock.matchAll(/- ([A-Z]{3}|USA) (\d+) -/g)) {
  const teamId = codeMap[placedMatch[1]]
  if (teamId) documentedPlaced.add(`${teamId}-${placedMatch[2]}`)
}

const errors = []
const missingFromApp = [...documentedPlaced].filter((id) => !knownIds.has(id)).sort()
const missingFromSeed = [...documentedPlaced].filter((id) => !defaultCollected.has(id)).sort()
const unknownSeeded = [...defaultCollected].filter((id) => !knownIds.has(id)).sort()
const seededFwc = [...defaultCollected].filter((id) => id.startsWith('fwc-')).sort()

if (documentedPlaced.size !== 299) {
  errors.push(`Expected 299 documented placed stickers, found ${documentedPlaced.size}.`)
}
if (defaultCollected.size !== 299) {
  errors.push(`Expected defaultCollected.size to be 299, found ${defaultCollected.size}.`)
}
if (missingFromApp.length > 0) {
  errors.push(`Documented placed IDs missing from app stickers: ${missingFromApp.join(', ')}`)
}
if (missingFromSeed.length > 0) {
  errors.push(`Documented placed IDs missing from defaultCollected: ${missingFromSeed.join(', ')}`)
}
if (unknownSeeded.length > 0) {
  errors.push(`Seeded IDs missing from app stickers: ${unknownSeeded.join(', ')}`)
}
if (seededFwc.length > 0) {
  errors.push(`FWC IDs must not be seeded from uncertain evidence: ${seededFwc.join(', ')}`)
}
if (defaultCollected.has('col-3') || defaultCollected.has('col-12')) {
  errors.push('Blocked Colombia slots col-3 and col-12 must not be seeded.')
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Album data validation passed.')
