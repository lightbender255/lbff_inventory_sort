const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function getHashMap (root) {
  const map = {}
  if (!fs.existsSync(root)) return map
  const files = walkSync(root)
  for (const f of files) {
    const rel = path.relative(root, f).replace(/\\/g, '/')
    const data = fs.readFileSync(f)
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    map[rel] = hash
  }
  return map
}

function walkSync (dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat && stat.isDirectory()) results = results.concat(walkSync(full))
    else results.push(full)
  })
  return results
}

const repoRoot = path.join(__dirname, '..')
const srcBP = path.join(repoRoot, 'lbff_bedrock_inventory_sorter_BP')
const srcRP = path.join(repoRoot, 'lbff_bedrock_inventory_sorter_RP')
const uwpBase = path.join(process.env.LOCALAPPDATA || '', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang')

const candidates = [
  { type: 'behavior', src: srcBP, dests: [path.join(uwpBase, 'development_behavior_packs', 'lbff_bedrock_inventory_sorter_BP'), path.join(uwpBase, 'behavior_packs', 'lbff_bedrock_inventory_sorter_BP')] },
  { type: 'resource', src: srcRP, dests: [path.join(uwpBase, 'development_resource_packs', 'lbff_bedrock_inventory_sorter_RP'), path.join(uwpBase, 'resource_packs', 'lbff_bedrock_inventory_sorter_RP')] }
]

let verificationFailed = false
let anyDestinationFound = false
for (const c of candidates) {
  if (!fs.existsSync(c.src)) { console.warn(`Source folder not found: ${c.src}. Skipping ${c.type}`); continue }
  console.log(`Verifying ${c.type} pack: ${c.src}`)
  const srcMap = getHashMap(c.src)
  for (const dest of c.dests) {
    if (!fs.existsSync(dest)) { console.warn(`Destination not found: ${dest}. Skipping`); continue }
    anyDestinationFound = true
    console.log(`Comparing to ${dest}`)
    const dstMap = getHashMap(dest)
    for (const k of Object.keys(srcMap)) {
      if (!Object.prototype.hasOwnProperty.call(dstMap, k)) {
        console.error(`Missing file in destination: ${k}`)
        verificationFailed = true
        continue
      }
      if (srcMap[k] !== dstMap[k]) {
        console.error(`Hash mismatch: ${k}\n  src: ${srcMap[k]}\n  dst: ${dstMap[k]}`)
        verificationFailed = true
      }
    }
    for (const k of Object.keys(dstMap)) {
      if (!Object.prototype.hasOwnProperty.call(srcMap, k)) {
        console.warn(`Extra file in destination (not in source): ${k}`)
      }
    }
  }
}

if (!anyDestinationFound) {
  console.log('No destination folders found to verify (likely running on hosted CI). Skipping checksum verification.')
  process.exitCode = 0
} else if (verificationFailed) {
  console.error('Checksum verification failed')
  process.exitCode = 2
} else {
  console.log('Checksum verification passed')
  process.exitCode = 0
}

// Export helpers for unit testing
module.exports = {
  getHashMap,
  walkSync
}
