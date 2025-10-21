// Updates the name field in both manifests using addon.config.json
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../addon.config.json');
const bpManifestPath = path.join(__dirname, '../lbff_bedrock_inventory_sorter_BP/manifest.json');
const rpManifestPath = path.join(__dirname, '../lbff_bedrock_inventory_sorter_RP/manifest.json');


function insertTypeBeforeHash(baseName, type) {
  // Insert 'type' just before the first # symbol (with a space)
  const hashIndex = baseName.indexOf('#');
  if (hashIndex === -1) return baseName + ` ${type}`;
  return baseName.slice(0, hashIndex) + type + ' ' + baseName.slice(hashIndex);
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
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const baseName = config.packName;
  const behaviorPackName = insertTypeBeforeHash(baseName, 'Behavior Pack');
  const resourcePackName = insertTypeBeforeHash(baseName, 'Resource Pack');
  updateManifestName(bpManifestPath, behaviorPackName);
  updateManifestName(rpManifestPath, resourcePackName);
}

main();
