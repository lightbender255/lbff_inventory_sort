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
    const { execSync } = require('child_process');
    const bdsRoot = process.env.COPY_BDS_ROOT || defaultBdsRoot;
    const bdsWorld = process.env.COPY_BDS_WORLD || 'worlds/';
    // If COPY_BDS_WORLD is a simple world name, join it to worlds
    const worldDestPath = bdsWorld.includes('worlds') ? bdsWorld : path.join('worlds', bdsWorld);
    const bpDest = path.join(bdsRoot, worldDestPath, 'behavior_packs', path.basename(bpSrc));
    const rpDest = path.join(bdsRoot, worldDestPath, 'resource_packs', path.basename(rpSrc));
    copyRecursiveSync(bpSrc, bpDest);
    copyRecursiveSync(rpSrc, rpDest);

    console.log('All packs copied to BDS at', bdsRoot);

    // Optionally auto-start/restart the BDS to pick up the new packs.
    // Controlled by COPY_BDS_AUTO_RESTART (default: 'true'). Set to 'false' to skip restart.
    const autoRestart = (process.env.COPY_BDS_AUTO_RESTART || 'true').toLowerCase() !== 'false';
    const bdsExe = path.join(bdsRoot, 'bedrock_server.exe');

    try {
      // Check for running bedrock_server process
      const checkCmd = `Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id`;
      const running = execSync(`powershell -NoProfile -Command "${checkCmd}"`, { encoding: 'utf8' }).trim();

      if (!running) {
        // Not running: start it
        if (!require('fs').existsSync(bdsExe)) {
          console.warn(`BDS executable not found at ${bdsExe}; skipping auto-start.`);
        } else {
          console.log('BDS not running; starting bedrock_server...');
          execSync(`powershell -NoProfile -Command "Start-Process -FilePath '${bdsExe}' -WorkingDirectory '${bdsRoot}' -NoNewWindow -PassThru"`);
          console.log('BDS started.');
        }
      } else if (autoRestart) {
        // Running: restart to pick up new packs
        console.log('BDS is running (pid ' + running + '); restarting to pick up new packs...');
        execSync(`powershell -NoProfile -Command "Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Stop-Process -Force"`);
        // small delay
        execSync(`powershell -NoProfile -Command "Start-Sleep -Seconds 1"`);
        if (!require('fs').existsSync(bdsExe)) {
          console.warn(`BDS executable not found at ${bdsExe}; unable to restart automatically.`);
        } else {
          execSync(`powershell -NoProfile -Command "Start-Process -FilePath '${bdsExe}' -WorkingDirectory '${bdsRoot}' -NoNewWindow -PassThru"`);
          console.log('BDS restarted.');
        }
      } else {
        console.log('BDS is running and auto-restart disabled; not restarting.');
      }
    } catch (err) {
      console.warn('Failed to auto-start/restart BDS:', err.message || err);
    }
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
