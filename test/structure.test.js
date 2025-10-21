import { describe, test, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.schema.json'), 'utf8'))
const validate = ajv.compile(schema)

const ADDON_ROOT = path.join(__dirname, '..')
const BP_PATH = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_BP')
const RP_PATH = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_RP')

function readJson (filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

describe('Addon Folder and Manifest Structure', () => {
  test('Behavior pack manifest validates against schema and has required script module', () => {
    expect(fs.existsSync(BP_PATH)).toBe(true)
    const bpManifestPath = path.join(BP_PATH, 'manifest.json')
    expect(fs.existsSync(bpManifestPath)).toBe(true)
    const manifest = readJson(bpManifestPath)
    const valid = validate(manifest)
    if (!valid) {
      console.error('Manifest validation errors:', validate.errors)
    }
    expect(valid).toBe(true)
    // Ensure there is a script module
    const hasScriptModule = manifest.modules.some(m => m.type === 'script' && typeof m.entry === 'string')
    expect(hasScriptModule).toBe(true)
  })

  test('Resource pack manifest validates against schema, includes resources module, and warns on missing icon', () => {
    expect(fs.existsSync(RP_PATH)).toBe(true)
    const rpManifestPath = path.join(RP_PATH, 'manifest.json')
    expect(fs.existsSync(rpManifestPath)).toBe(true)
    const manifest = readJson(rpManifestPath)
    const valid = validate(manifest)
    if (!valid) {
      console.error('Manifest validation errors:', validate.errors)
    }
    expect(valid).toBe(true)
    const hasResourcesModule = manifest.modules.some(m => m.type === 'resources')
    expect(hasResourcesModule).toBe(true)

    // Check pack_icon existence and warn if missing
    const iconPath = path.join(RP_PATH, 'pack_icon.png')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    if (!fs.existsSync(iconPath)) {
      console.warn(`Warning: Resource pack icon not found at ${iconPath}`)
    }
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
