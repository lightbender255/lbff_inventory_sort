import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const strictSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.strict.schema.json'), 'utf8'));
const validateStrict = ajv.compile(strictSchema);

describe('Manifest Negative Tests', () => {
  test('behavior manifest missing min_engine_version should fail strict schema', () => {
    const bpManifestPath = path.join(__dirname, '..', 'lbff_bedrock_inventory_sorter_BP', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(bpManifestPath, 'utf8'));
    // remove min_engine_version to simulate invalid manifest
    const modified = JSON.parse(JSON.stringify(manifest));
    delete modified.header.min_engine_version;
    const valid = validateStrict(modified);
    expect(valid).toBe(false);
    expect(validateStrict.errors.length).toBeGreaterThan(0);
  });

  test('resource manifest with missing dependencies should fail strict schema', () => {
    const rpManifestPath = path.join(__dirname, '..', 'lbff_bedrock_inventory_sorter_RP', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(rpManifestPath, 'utf8'));
    const modified = JSON.parse(JSON.stringify(manifest));
    delete modified.dependencies;
    const valid = validateStrict(modified);
    expect(valid).toBe(false);
    expect(validateStrict.errors.length).toBeGreaterThan(0);
  });

  test('behavior manifest with invalid UUID should fail strict schema', () => {
    const bpManifestPath = path.join(__dirname, '..', 'lbff_bedrock_inventory_sorter_BP', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(bpManifestPath, 'utf8'));
    const modified = JSON.parse(JSON.stringify(manifest));
    // corrupt the header uuid
    if (modified.header && modified.header.uuid) {
      modified.header.uuid = 'not-a-uuid';
    }
    const valid = validateStrict(modified);
    expect(valid).toBe(false);
    expect(validateStrict.errors.some(e => e.instancePath.includes('header') || e.instancePath.includes('uuid'))).toBe(true);
  });

  test('resource manifest with wrong format_version should fail strict schema', () => {
    const rpManifestPath = path.join(__dirname, '..', 'lbff_bedrock_inventory_sorter_RP', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(rpManifestPath, 'utf8'));
    const modified = JSON.parse(JSON.stringify(manifest));
    modified.format_version = 1; // strict schema requires 2
    const valid = validateStrict(modified);
    expect(valid).toBe(false);
    expect(validateStrict.errors.some(e => e.instancePath.includes('format_version'))).toBe(true);
  });

  test('behavior manifest with unexpected additional property should fail strict schema', () => {
    const bpManifestPath = path.join(__dirname, '..', 'lbff_bedrock_inventory_sorter_BP', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(bpManifestPath, 'utf8'));
    const modified = JSON.parse(JSON.stringify(manifest));
    modified.header.__unexpected = 'surprise';
    const valid = validateStrict(modified);
    // depending on strict schema additionalProperties may be false on header
    // we assert that either validation fails or it passes but schema allows extras
    expect(valid).toBe(false);
  });
});
