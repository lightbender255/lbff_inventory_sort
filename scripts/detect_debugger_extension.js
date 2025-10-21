const fs = require('fs')
const path = require('path')

// This script attempts to detect whether a known Minecraft Debugger extension is installed for the current user
// It checks the usual VS Code extensions directory and looks for common extension IDs. It prints a single JSON
// object with keys { found: boolean, extension: string|null }

const home = process.env.USERPROFILE || process.env.HOME
if (!home) {
  console.error(JSON.stringify({ found: false, extension: null }))
  process.exit(0)
}

// Common extension IDs to check (add more if you use different extensions)
const candidates = [
  'gamersparadise.minecraft-debugger',
  'minecraft-dev.minecraft-debugger',
  'microsoft.minecraft-debugger'
]

const extensionsDir = path.join(home, '.vscode', 'extensions')
let found = false
let which = null

try {
  const items = fs.readdirSync(extensionsDir)
  for (const item of items) {
    for (const cand of candidates) {
      if (item.toLowerCase().startsWith(cand.toLowerCase())) {
        found = true
        which = item
        break
      }
    }
    if (found) break
  }
} catch (e) {
  // If we couldn't read extensions dir, assume not found
}

console.log(JSON.stringify({ found, extension: which }))
