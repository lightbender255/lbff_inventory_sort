// Updates the name field in both manifests using addon.config.json
const fs = require('fs');
const path = require('path');

let ADDON_ROOT = process.env.ADDON_ROOT || path.join(__dirname, '..');
let configPath = path.join(ADDON_ROOT, 'addon.config.json');
let bpManifestPath = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_BP', 'manifest.json');
let rpManifestPath = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_RP', 'manifest.json');

const { insertTypeBeforeLastHash } = require(path.join(__dirname, 'name_utils.js'));

// Export for testing and allow running as a script
if (typeof module !== 'undefined' && module.exports) {
  module.exports.updateManifestName = updateManifestName;
  module.exports.main = main;
}

// If executed directly, run main
if (require.main === module) {
  main();
}

function updateManifestName(manifestPath, newName) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.header && typeof manifest.header.name === 'string') {
    manifest.header.name = newName;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Updated name in ${manifestPath}`);
  } else {
    console.warn(`No header.name found in ${manifestPath}`);
  }
}

function main() {
  // Recompute paths so tests can set process.env.ADDON_ROOT before calling main
  ADDON_ROOT = process.env.ADDON_ROOT || path.join(__dirname, '..');
  configPath = path.join(ADDON_ROOT, 'addon.config.json');
  bpManifestPath = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_BP', 'manifest.json');
  rpManifestPath = path.join(ADDON_ROOT, 'lbff_bedrock_inventory_sorter_RP', 'manifest.json');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const baseName = config.packName;
  const behaviorPackName = insertTypeBeforeLastHash(baseName, 'Behavior Pack');
  const resourcePackName = insertTypeBeforeLastHash(baseName, 'Resource Pack');
  updateManifestName(bpManifestPath, behaviorPackName);
  updateManifestName(rpManifestPath, resourcePackName);
}
