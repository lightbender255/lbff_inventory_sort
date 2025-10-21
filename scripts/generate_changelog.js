const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

function exec (cmd) {
  return childProcess.execSync(cmd, { encoding: 'utf8' }).trim()
}

const repoRoot = path.join(__dirname, '..')
const outFile = path.join(repoRoot, 'CHANGELOG.md')

// Accept an optional tag argument (ENV or CLI)
const tagArg = process.argv[2] || process.env.GIT_TAG || null

let baseRef = null
if (tagArg) {
  baseRef = tagArg
} else {
  try {
    baseRef = exec('git describe --tags --abbrev=0')
  } catch (e) {
    baseRef = null
  }
}

let range = null
if (baseRef) range = `${baseRef}..HEAD`
else range = 'HEAD'

let commits = []
try {
  const gitLogCmd = baseRef ? `git log ${range} --pretty=format:%s__%h` : 'git log --pretty=format:%s__%h'
  const out = exec(gitLogCmd)
  if (out) {
    commits = out.split('\n').map(l => {
      const [msg, sha] = l.split('__')
      return `- ${msg.trim()} (${sha.trim()})`
    })
  }
} catch (e) {
  // no commits
}

const date = new Date().toISOString().slice(0, 10)
const heading = baseRef ? `## ${baseRef} - ${date}` : `## Unreleased - ${date}`
const entry = [heading, '', ...(commits.length ? commits : ['- (no recorded commits)']), '', '']

let existing = ''
if (fs.existsSync(outFile)) existing = fs.readFileSync(outFile, 'utf8')

const combined = entry.join('\n') + existing
fs.writeFileSync(outFile, combined, 'utf8')
console.log('Wrote changelog to', outFile)
