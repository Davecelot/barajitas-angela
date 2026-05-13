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
  MAR: 'mar',
  HAI: 'hai',
  SCO: 'sco',
  USA: 'usa',
  PAR: 'par',
  AUS: 'aus',
  TUR: 'tur',
  GER: 'ger',
  CUW: 'cuw',
  ECU: 'ecu',
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
  KSA: 'sau',
  SAU: 'sau',
  URU: 'uru',
  FRA: 'fra',
  SEN: 'sen',
  NOR: 'nor',
  IRQ: 'irq',
  ARG: 'arg',
  ALG: 'alg',
  JOR: 'jor',
  AUT: 'aut',
  COD: 'cod',
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

const teamLabelsUseFigureCode =
  albumSource.includes('name: figureCode(id, number)') &&
  !albumSource.includes("name: 'Escudo'") &&
  !albumSource.includes('name: `We Are ${weAre}`') &&
  !albumSource.includes('name: `We Are ${_weAre}`')
const invalidSpecialLabels = []
for (let number = 1; number <= 18; number += 1) {
  if (!albumSource.includes(`name: \`FWC\${i + 1}\``)) invalidSpecialLabels.push(`fwc-${number}`)
}
for (let number = 1; number <= 14; number += 1) {
  if (!albumSource.includes(`name: \`CC\${i + 1}\``)) invalidSpecialLabels.push(`cc-${number}`)
}

const alreadyPlacedBlock =
  analysisSource.match(/## Already Placed([\s\S]*?)## Left To Be Placed/)?.[1] ?? ''
const photoPlaced = new Set()
for (const placedMatch of alreadyPlacedBlock.matchAll(/- ([A-Z]{3}|USA) (\d+) -/g)) {
  const teamId = codeMap[placedMatch[1]]
  if (teamId) photoPlaced.add(`${teamId}-${placedMatch[2]}`)
}

const controlSheetBlock =
  analysisSource.match(
    /### Confirmed Red Checks([\s\S]*?)### Uncertain Red Checks/,
  )?.[1] ?? ''
const controlSheetConfirmed = new Set(
  [...controlSheetBlock.matchAll(/`([a-z]{3}-\d+)`/g)].map((match) => match[1]),
)
const documentedCollected = new Set([...photoPlaced, ...controlSheetConfirmed])

const errors = []
const missingFromApp = [...documentedCollected].filter((id) => !knownIds.has(id)).sort()
const missingFromSeed = [...documentedCollected].filter((id) => !defaultCollected.has(id)).sort()
const unknownSeeded = [...defaultCollected].filter((id) => !knownIds.has(id)).sort()
const seededFwc = [...defaultCollected].filter((id) => id.startsWith('fwc-')).sort()
const seededCc = [...defaultCollected].filter((id) => id.startsWith('cc-')).sort()
const seededWithoutEvidence = [...defaultCollected].filter((id) => !documentedCollected.has(id)).sort()

if (photoPlaced.size !== 328) {
  errors.push(`Expected 328 photo-placed stickers, found ${photoPlaced.size}.`)
}
if (controlSheetConfirmed.size !== 426) {
  errors.push(`Expected 426 control-sheet confirmed stickers, found ${controlSheetConfirmed.size}.`)
}
if (documentedCollected.size !== 609) {
  errors.push(`Expected 609 documented collected stickers, found ${documentedCollected.size}.`)
}
if (defaultCollected.size !== documentedCollected.size) {
  errors.push(
    `Expected defaultCollected.size to be ${documentedCollected.size}, found ${defaultCollected.size}.`,
  )
}
if (missingFromApp.length > 0) {
  errors.push(`Documented collected IDs missing from app stickers: ${missingFromApp.join(', ')}`)
}
if (missingFromSeed.length > 0) {
  errors.push(`Documented collected IDs missing from defaultCollected: ${missingFromSeed.join(', ')}`)
}
if (unknownSeeded.length > 0) {
  errors.push(`Seeded IDs missing from app stickers: ${unknownSeeded.join(', ')}`)
}
if (seededFwc.length > 0) {
  errors.push(`FWC IDs must not be seeded from uncertain evidence: ${seededFwc.join(', ')}`)
}
if (seededCc.length > 0) {
  errors.push(`CC IDs must not be seeded without confident control-sheet/photo evidence: ${seededCc.join(', ')}`)
}
if (seededWithoutEvidence.length > 0) {
  errors.push(`Seeded IDs missing from documented evidence: ${seededWithoutEvidence.join(', ')}`)
}
if (defaultCollected.has('col-3') || defaultCollected.has('col-12')) {
  errors.push('Blocked Colombia slots col-3 and col-12 must not be seeded.')
}
if (!teamLabelsUseFigureCode) {
  errors.push('Team stickers must use figure-code display labels from figureCode(id, number).')
}
if (invalidSpecialLabels.length > 0) {
  errors.push(`Special stickers must use figure-code display labels: ${invalidSpecialLabels.join(', ')}`)
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Album data validation passed.')
