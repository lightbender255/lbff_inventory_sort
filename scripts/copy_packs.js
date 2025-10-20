const fs = require('fs');
const path = require('path');

// Config paths for dev packs
const bpDest = 'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/lbff_bedrock_inventory_sorter_BP';
const rpDest = 'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs/lbff_bedrock_inventory_sorter_RP';

const bpSrc = path.resolve(__dirname, '../lbff_bedrock_inventory_sorter_BP');
const rpSrc = path.resolve(__dirname, '../lbff_bedrock_inventory_sorter_RP');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursiveSync(bpSrc, bpDest);
  copyRecursiveSync(rpSrc, rpDest);
  console.log('All packs copied successfully.');
} catch (err) {
  console.error('Error copying packs:', err);
  process.exit(1);
}
