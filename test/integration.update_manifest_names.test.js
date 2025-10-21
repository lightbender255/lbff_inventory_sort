import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const { main } = require(path.join(__dirname, '..', 'scripts', 'update_manifest_names.js'));

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

describe('Integration: update_manifest_names', () => {
  test('updates both manifests with Behavior/Resource Pack inserted before last #', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lbff-test-'));
    try {
      // Create structure
      const bpDir = path.join(tmp, 'lbff_bedrock_inventory_sorter_BP');
      const rpDir = path.join(tmp, 'lbff_bedrock_inventory_sorter_RP');
      fs.mkdirSync(bpDir);
      fs.mkdirSync(rpDir);

      const baseName = '# LBFF Inventory Sorter #';
      writeJson(path.join(tmp, 'addon.config.json'), { packName: baseName });

      const bpManifest = {
        format_version: 2,
        header: { name: baseName, description: 'bp', uuid: '636be0b5-50b9-4508-ba44-ef4c5a7bc984', version: [1,0,0] },
        modules: [{ type: 'script', entry: 'scripts/main.js' }]
      };
      const rpManifest = {
        format_version: 2,
        header: { name: baseName, description: 'rp', uuid: '636be0b5-50b9-4508-ba44-ef4c5a7bc985', version: [1,0,0] },
        modules: [{ type: 'resources' }]
      };
      writeJson(path.join(bpDir, 'manifest.json'), bpManifest);
      writeJson(path.join(rpDir, 'manifest.json'), rpManifest);

      // Run main with ADDON_ROOT overridden
      process.env.ADDON_ROOT = tmp;
      main();

      const updatedBp = JSON.parse(fs.readFileSync(path.join(bpDir, 'manifest.json'), 'utf8'));
      const updatedRp = JSON.parse(fs.readFileSync(path.join(rpDir, 'manifest.json'), 'utf8'));

      expect(updatedBp.header.name).toBe('# LBFF Inventory Sorter Behavior Pack #');
      expect(updatedRp.header.name).toBe('# LBFF Inventory Sorter Resource Pack #');
    } finally {
      // Cleanup
      fs.rmSync(tmp, { recursive: true, force: true });
      delete process.env.ADDON_ROOT;
    }
  });
});
