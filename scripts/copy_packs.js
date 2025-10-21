const fs = require('fs');
const path = require('path');

// Config paths for dev packs (client) - default
const clientBpDest = 'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/lbff_bedrock_inventory_sorter_BP';
const clientRpDest = 'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs/lbff_bedrock_inventory_sorter_RP';

const bpSrc = path.resolve(__dirname, '../lbff_bedrock_inventory_sorter_BP');
const rpSrc = path.resolve(__dirname, '../lbff_bedrock_inventory_sorter_RP');

// BDS defaults - can be overridden with COPY_BDS_ROOT and COPY_BDS_WORLD env vars
const defaultBdsRoot = 'C:/game/game_servers/bedrock-server-1.21';

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
  // Determine target: 'client' (default) or 'bds'
  const argv = process.argv.slice(2);
  const target = argv[0] || process.env.COPY_TARGET || 'client';

  if (target === 'bds') {
    const bdsRoot = process.env.COPY_BDS_ROOT || defaultBdsRoot;
    const bdsWorld = process.env.COPY_BDS_WORLD || 'worlds/';
    // If COPY_BDS_WORLD is a simple world name, join it to worlds
    const worldDestPath = bdsWorld.includes('worlds') ? bdsWorld : path.join('worlds', bdsWorld);
    const bpDest = path.join(bdsRoot, worldDestPath, 'behavior_packs', path.basename(bpSrc));
    const rpDest = path.join(bdsRoot, worldDestPath, 'resource_packs', path.basename(rpSrc));
    copyRecursiveSync(bpSrc, bpDest);
    copyRecursiveSync(rpSrc, rpDest);
    console.log('All packs copied to BDS at', bdsRoot);
  } else {
    // default: client development folders
    const bpDest = clientBpDest;
    const rpDest = clientRpDest;
    copyRecursiveSync(bpSrc, bpDest);
    copyRecursiveSync(rpSrc, rpDest);
    console.log('All packs copied successfully.');
  }
} catch (err) {
  console.error('Error copying packs:', err);
  process.exit(1);
}
