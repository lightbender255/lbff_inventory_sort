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
  const dryRun = argv.includes('--dry-run') || process.env.COPY_DRY_RUN === 'true';
  const serverWide = argv.includes('--server-wide') || process.env.COPY_SERVER_WIDE === 'true';

  if (target === 'bds') {
    const { execSync } = require('child_process');
    const bdsRoot = process.env.COPY_BDS_ROOT || defaultBdsRoot;
    const bdsWorld = process.env.COPY_BDS_WORLD || 'worlds/';
    // Compute destinations
    let bpDest, rpDest;
    if (serverWide) {
      bpDest = path.join(bdsRoot, 'behavior_packs', path.basename(bpSrc));
      rpDest = path.join(bdsRoot, 'resource_packs', path.basename(rpSrc));
    } else {
      const worldDestPath = bdsWorld.includes('worlds') ? bdsWorld : path.join('worlds', bdsWorld);
      bpDest = path.join(bdsRoot, worldDestPath, 'behavior_packs', path.basename(bpSrc));
      rpDest = path.join(bdsRoot, worldDestPath, 'resource_packs', path.basename(rpSrc));
    }

    if (dryRun) {
      console.log('[dry-run] Would copy', bpSrc, '->', bpDest);
      console.log('[dry-run] Would copy', rpSrc, '->', rpDest);
    } else {
      copyRecursiveSync(bpSrc, bpDest);
      copyRecursiveSync(rpSrc, rpDest);
      console.log('All packs copied to BDS at', bdsRoot);
    }

    // Optionally auto-start/restart the BDS to pick up the new packs.
    // Controlled by COPY_BDS_AUTO_RESTART (default: 'true'). Set to 'false' to skip restart.
    const autoRestart = (process.env.COPY_BDS_AUTO_RESTART || 'true').toLowerCase() !== 'false';
    const bdsExe = path.join(bdsRoot, 'bedrock_server.exe');

    try {
      // Prefer using bds_manager if available to perform controlled stdin 'stop' command
      const net = require('net');
      const managerPort = parseInt(process.env.BDS_MANAGER_PORT || '30303', 10);

      const sendManager = (obj) => new Promise((resolve, reject) => {
        const sock = new net.Socket();
        let resp = '';
        sock.setEncoding('utf8');
        sock.connect(managerPort, '127.0.0.1', () => {
          sock.write(JSON.stringify(obj) + '\n');
        });
        sock.on('data', (d) => { resp += d; });
        sock.on('close', () => { try { resolve(JSON.parse(resp.trim())); } catch(e) { resolve({ raw: resp }); } });
        sock.on('error', (err) => reject(err));
      });

      let managerAvailable = false;
      try {
        const s = new net.Socket();
        await new Promise((res, rej) => {
          s.setTimeout(200);
          s.once('connect', () => { managerAvailable = true; s.destroy(); res(); });
          s.once('timeout', () => { s.destroy(); res(); });
          s.once('error', () => { s.destroy(); res(); });
          s.connect(managerPort, '127.0.0.1');
        });
      } catch (e) { /* ignore */ }

      if (managerAvailable) {
        console.log('Using bds_manager at port', managerPort, 'to perform graceful restart.');
        if (dryRun) {
          console.log('[dry-run] Would send restart to bds_manager');
        } else if (autoRestart) {
          await sendManager({ cmd: 'restart' });
          console.log('Requested restart via bds_manager.');
        } else {
          console.log('Auto-restart disabled; not restarting via bds_manager.');
        }
      } else {
        // Fallback to previous behavior using PowerShell commands
        const checkCmd = `Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id`;
        const running = execSync(`powershell -NoProfile -Command "${checkCmd}"`, { encoding: 'utf8' }).trim();

        if (!running) {
          // Not running: start it (unless dry-run)
          if (!require('fs').existsSync(bdsExe)) {
            console.warn(`BDS executable not found at ${bdsExe}; skipping auto-start.`);
          } else if (dryRun) {
            console.log('[dry-run] Would start bedrock_server at', bdsExe);
          } else {
            console.log('BDS not running; starting bedrock_server...');
            execSync(`powershell -NoProfile -Command "Start-Process -FilePath '${bdsExe}' -WorkingDirectory '${bdsRoot}' -NoNewWindow -PassThru"`);
            console.log('BDS started.');
          }
        } else if (autoRestart) {
          // Running: attempt graceful restart to pick up new packs
          console.log('BDS is running (pid ' + running + '); restarting to pick up new packs...');

          if (dryRun) {
            console.log('[dry-run] Would attempt graceful shutdown of bedrock_server (pid ' + running + ')');
          } else {
            try {
              // Try graceful close via CloseMainWindow using PowerShell
              const closeCmd = `Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | ForEach-Object { $_.CloseMainWindow() ; $_ } | Select-Object -ExpandProperty Id`;
              execSync(`powershell -NoProfile -Command "${closeCmd}"`, { encoding: 'utf8' });
              // Wait up to 10 seconds for process to exit
              const waitCmd = `for ($i=0; $i -lt 10; $i++) { if (-not (Get-Process -Name bedrock_server -ErrorAction SilentlyContinue)) { exit 0 } Start-Sleep -Seconds 1 }; exit 1`;
              const exited = execSync(`powershell -NoProfile -Command "${waitCmd}"`, { encoding: 'utf8' }).trim();
              // If still running, force stop
              const stillRunning = execSync(`powershell -NoProfile -Command "Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"`, { encoding: 'utf8' }).trim();
              if (stillRunning) {
                console.log('Graceful shutdown did not complete; forcing stop...');
                execSync(`powershell -NoProfile -Command "Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Stop-Process -Force"`);
              }
            } catch (err) {
              // If any step fails, fall back to force stop
              console.warn('Graceful shutdown failed or timed out; forcing stop:', err.message || err);
              try { execSync(`powershell -NoProfile -Command "Get-Process -Name bedrock_server -ErrorAction SilentlyContinue | Stop-Process -Force"`); } catch (e) { /* ignore */ }
            }

            // small delay
            execSync(`powershell -NoProfile -Command "Start-Sleep -Seconds 1"`);
            if (!require('fs').existsSync(bdsExe)) {
              console.warn(`BDS executable not found at ${bdsExe}; unable to restart automatically.`);
            } else {
              execSync(`powershell -NoProfile -Command "Start-Process -FilePath '${bdsExe}' -WorkingDirectory '${bdsRoot}' -NoNewWindow -PassThru"`);
              console.log('BDS restarted.');
            }
          }
        } else {
          console.log('BDS is running and auto-restart disabled; not restarting.');
        }
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
