const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

function timestamp () {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

const resultsDir = path.resolve(__dirname, '..', 'test', 'results')
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true })

const ts = timestamp()
const txtPath = path.join(resultsDir, `test-output-${ts}.txt`)
const mdPath = path.join(resultsDir, `test-output-${ts}.md`)

console.log('Running vitest and saving output to', mdPath)

let child
try {
  // Use the shell to be robust on Windows (PowerShell/CMD) and avoid spawn EINVAL issues
  child = spawn('npx', ['vitest', 'run'], { shell: true })
} catch (err) {
  console.error('Failed to start test runner:', err)
  process.exit(1)
}

child.on('error', (err) => {
  console.error('Test runner process error:', err)
  process.exit(1)
})

let out = ''
child.stdout.on('data', (chunk) => { out += chunk.toString(); process.stdout.write(chunk) })
child.stderr.on('data', (chunk) => { out += chunk.toString(); process.stderr.write(chunk) })

child.on('close', (code) => {
  try {
    // Save raw txt
    fs.writeFileSync(txtPath, out, { encoding: 'utf8' })

    // Strip ANSI escape sequences without embedding control characters directly in the source.
    function stripAnsi (s) {
      let res = ''
      for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (ch === '\\x1b') {
          // This branch will rarely match because stdin contains the actual ESC byte; fall back to skipping
          // sequences starting with ESC+[...m by advancing until 'm'
          let j = i + 1
          while (j < s.length && s[j] !== 'm') j++
          i = j
          continue
        }
        // Handle actual ESC char written as Unicode escape in string values
        if (s.charCodeAt(i) === 27 && s[i + 1] === '[') {
          // skip until 'm' or end
          let j = i + 2
          while (j < s.length && s[j] !== 'm') j++
          i = j
          continue
        }
        res += ch
      }
      return res
    }
    const clean = stripAnsi(out).replace(/Γ£ô/g, '●')
    const md = `## Test run saved: ${new Date().toISOString()}\n\n` + '```console\n' + clean.trim() + '\n```\n'
    fs.writeFileSync(mdPath, md, { encoding: 'utf8' })

    // Remove the raw txt file to avoid tracking raw outputs
    try { fs.unlinkSync(txtPath) } catch (e) { /* ignore */ }
    console.log('Saved test markdown to', mdPath)
  } catch (err) {
    console.error('Failed to save test results:', err)
  }
  process.exit(code)
})
