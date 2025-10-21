const fs = require('fs')
const path = require('path')

// Tail the latest ContentLog file until the startup marker appears, then exit.
const logsDir = path.join(process.env.LOCALAPPDATA || '', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang', 'logs')
if (!fs.existsSync(logsDir)) {
  console.error('Logs folder not found:', logsDir)
  process.exit(2)
}

function latestLog() {
  const files = fs.readdirSync(logsDir)
    .filter(f => f.toLowerCase().startsWith('contentlog'))
    .map(f => ({ f, m: fs.statSync(path.join(logsDir, f)).mtimeMs }))
  if (files.length === 0) return null
  files.sort((a, b) => b.m - a.m)
  return path.join(logsDir, files[0].f)
}

let file = latestLog()
if (!file) {
  console.error('No ContentLog files found in', logsDir)
  process.exit(2)
}

console.log('Tailing', file, "for 'LBFF Inventory Sorter startup'")

const stream = fs.createReadStream(file, { encoding: 'utf8', start: fs.statSync(file).size })
stream.on('data', data => {
  process.stdout.write(data)
  if (data.includes('LBFF Inventory Sorter startup')) {
    console.log('\nFound startup marker. Exiting.')
    process.exit(0)
  }
})

// watch for file rotation
fs.watch(logsDir, (ev, filename) => {
  const newFile = latestLog()
  if (newFile && newFile !== file) {
    console.log('Log rotated. Now tailing:', newFile)
    file = newFile
    stream.close()
    // start new stream
    const newStream = fs.createReadStream(file, { encoding: 'utf8', start: fs.statSync(file).size })
    newStream.on('data', data => {
      process.stdout.write(data)
      if (data.includes('LBFF Inventory Sorter startup')) {
        console.log('\nFound startup marker. Exiting.')
        process.exit(0)
      }
    })
  }
})
