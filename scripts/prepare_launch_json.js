const fs = require('fs')
const path = require('path')

const repoRoot = path.join(__dirname, '..')
const vscodeDir = path.join(repoRoot, '.vscode')
const baseLaunch = path.join(vscodeDir, 'launch.json')
const outLaunch = path.join(vscodeDir, 'launch.generated.json')

if (!fs.existsSync(baseLaunch)) {
  console.error('Base launch.json not found:', baseLaunch)
  process.exit(2)
}

const detect = require('./detect_debugger_extension')
let result = { found: false, extension: null }
try {
  // detect_debugger_extension prints JSON; attempt to require its file output logic instead by executing it
  const spawnSync = require('child_process').spawnSync
  const res = spawnSync('node', [path.join(__dirname, 'detect_debugger_extension.js')], { encoding: 'utf8' })
  if (res.status === 0 && res.stdout) {
    result = JSON.parse(res.stdout)
  }
} catch (e) {
  // ignore
}

const base = JSON.parse(fs.readFileSync(baseLaunch, 'utf8'))
// toggle the second configuration's type
if (base.configurations && base.configurations.length >= 2) {
  if (result.found) {
    base.configurations[1].type = 'minecraft-debug'
    console.log('Detected Minecraft Debugger extension; keeping minecraft-debug type.')
  } else {
    base.configurations[1].type = 'node'
    console.log('Minecraft Debugger extension not detected; using node as fallback for second configuration.')
  }
}

fs.writeFileSync(outLaunch, JSON.stringify(base, null, 2))
console.log('Wrote', outLaunch)
