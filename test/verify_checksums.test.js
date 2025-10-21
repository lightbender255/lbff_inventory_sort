import fs from 'fs'
import path from 'path'
import os from 'os'
import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { getHashMap, walkSync } = require('../scripts/verify_checksums')

function writeFiles(base, files) {
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(base, p)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
  }
}

describe('verify_checksums helpers', () => {
  it('getHashMap returns same hashes for identical source and destination', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-'))
    const src = path.join(tmp, 'src')
    const dst = path.join(tmp, 'dst')
    fs.mkdirSync(src, { recursive: true })
    fs.mkdirSync(dst, { recursive: true })

    const files = {
      'a.txt': 'hello',
      'sub/b.txt': 'world',
      'sub/c.bin': Buffer.from([0,1,2,3])
    }
    writeFiles(src, files)
    writeFiles(dst, files)

    const sMap = getHashMap(src)
    const dMap = getHashMap(dst)

    expect(Object.keys(sMap).sort()).toEqual(Object.keys(dMap).sort())
    for (const k of Object.keys(sMap)) expect(sMap[k]).toBe(dMap[k])
  })

  it('getHashMap detects hash differences when file differs', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-'))
    const src = path.join(tmp, 'src')
    const dst = path.join(tmp, 'dst')
    fs.mkdirSync(src, { recursive: true })
    fs.mkdirSync(dst, { recursive: true })

    writeFiles(src, { 'a.txt': 'hello' })
    writeFiles(dst, { 'a.txt': 'goodbye' })

    const sMap = getHashMap(src)
    const dMap = getHashMap(dst)

    expect(sMap['a.txt']).not.toBe(dMap['a.txt'])
  })
})
