const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

// Create a .mcaddon by zipping behavior and resource packs into a single archive and renaming to .mcaddon
const repoRoot = path.join(__dirname, '..')
const outDir = path.join(repoRoot, 'dist')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Prefer packaging from the build output defined in tsconfig.json outDir when available
let bp = path.join(repoRoot, 'lbff_bedrock_inventory_sorter_BP')
try {
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    const cfg = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
    if (cfg && cfg.compilerOptions && cfg.compilerOptions.outDir) {
      // outDir often points directly into the BP scripts folder; use BP root above that
      const outDir = cfg.compilerOptions.outDir
      bp = path.resolve(repoRoot, path.dirname(outDir))
    }
  }
} catch (e) {
  // ignore and use default
}
const rp = path.join(repoRoot, 'lbff_bedrock_inventory_sorter_RP')
// Determine artifact name using package.json version (fallback to behavior pack manifest header.version)
let version = '0.0.0'
try {
  const pkgPath = path.join(repoRoot, 'package.json')
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    if (pkg && pkg.version) version = pkg.version
  }
} catch (e) {
  // ignore
}
// fallback to behavior pack manifest.json header.version (array)
try {
  const manifestPath = path.join(bp, 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if ((!version || version === '0.0.0') && manifest && manifest.header && Array.isArray(manifest.header.version)) {
      version = manifest.header.version.join('.')
    }
  }
} catch (e) {
  // ignore
}

const artifactBaseName = `lbff_inventory_sorter-${version}.mcaddon`
const outFile = path.join(outDir, artifactBaseName)

function addFolderToArchive (archive, folder, prefix) {
  if (!fs.existsSync(folder)) return
  const items = fs.readdirSync(folder)
  items.forEach(item => {
    const full = path.join(folder, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      archive.directory(full, path.join(prefix, item))
    } else {
      archive.file(full, { name: path.join(prefix, item) })
    }
  })
}

console.log('Packaging .mcaddon to', outFile)
const output = fs.createWriteStream(outFile)
const archive = archiver('zip', { zlib: { level: 9 } })
output.on('close', () => {
  console.log('Packaged', archive.pointer(), 'total bytes')
  try {
    // write artifact name for CI consumers to read
    fs.writeFileSync(path.join(outDir, 'artifact_name.txt'), artifactBaseName, 'utf8')
  } catch (err) {
    console.warn('Could not write artifact_name.txt:', err.message)
  }
})
archive.on('warning', err => console.warn(err))
archive.on('error', err => { throw err })
archive.pipe(output)

addFolderToArchive(archive, bp, 'behavior_packs/lbff_bedrock_inventory_sorter_BP')
addFolderToArchive(archive, rp, 'resource_packs/lbff_bedrock_inventory_sorter_RP')

archive.finalize()
