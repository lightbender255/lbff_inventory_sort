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
});
