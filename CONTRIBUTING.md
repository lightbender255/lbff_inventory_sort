# Contributing

This document covers development workflows specific to the LBFF Inventory Sorter addon, including building, testing, and deploying to the local UWP client and to a Bedrock Dedicated Server (BDS) instance.

## Building and Testing

### Install dependencies

```powershell
npm ci
```

### Run tests (non-watch, suitable for CI)

```powershell
npm test
```

### Linting

We use ESLint to keep code consistent. Run lint locally before committing:

```powershell
npm run lint
```

The CI workflow runs lint and tests on push/PR and will upload the saved Markdown test results as a workflow artifact named `test-results`.

## Deploying Packs (Client and BDS)

This project provides scripts to update pack manifests and copy the built behavior/resource packs to either the local UWP Minecraft development folders (default) or to a BDS world.

### Default (UWP Client Development Folders)

To update manifests and copy packs into your local UWP Minecraft development folders (used for quick client-side testing):

```powershell
npm run copy:packs
# or run the full build pipeline which includes copying to client folders
npm run build
```

The default destination paths are configured in `scripts/copy_packs.js` and point to the UWP development pack folders under your user profile. These are safe for local testing and will be overwritten by the script when copied.

### Deploying To A Bedrock Dedicated Server (BDS)

You can also deploy the packs directly into a BDS world. This is useful for testing server-side behavior and scripting.

The project exposes `copy:packs:bds` and `build:bds` scripts which use environment variables to locate the server root and world folder.

#### Environment variables

- `COPY_BDS_ROOT` — root folder of the BDS installation. Defaults to `C:/game/game_servers/bedrock-server-1.21`.
- `COPY_BDS_WORLD` — folder name or path of the world under the BDS root (for example `my_world` or `worlds/my_world`). Defaults to `worlds/`.

#### Examples (PowerShell)

```powershell
# Deploy to default BDS root and default world path
npm run copy:packs:bds

# Deploy to a specific world under a BDS root
$env:COPY_BDS_ROOT = 'C:/game/game_servers/bedrock-server-1.21'
$env:COPY_BDS_WORLD = 'my_world'
npm run copy:packs:bds

# Full build pipeline and deploy to BDS
$env:COPY_BDS_ROOT = 'C:/game/game_servers/bedrock-server-1.21'
$env:COPY_BDS_WORLD = 'my_world'
npm run build:bds
```

### Notes

- `copy_packs.js` will create destination directories if they do not exist and will recursively copy files from the addon pack folders.
- The script supports a `COPY_TARGET` env var or passing `bds` as the first CLI argument. For example:

```powershell
node scripts/copy_packs.js bds
# or
$env:COPY_TARGET = 'bds'; node scripts/copy_packs.js
```

### Server-wide vs World-specific Deployment

Currently the script copies packs into the specified world's `behavior_packs` and `resource_packs` directories. If you prefer to deploy server-wide (under the BDS root `behavior_packs/` or `resource_packs/`), file a task or request and we can add a `--server-wide` flag.

## Safety and Recommendations

- Use `COPY_BDS_ROOT` pointed to a test server when trying these scripts for the first time — the script will create and overwrite files.
- If testing with the UWP client on the same machine, you may need to run the loopback exemption to allow the client to connect to a local server:

```powershell
# Run as Administrator
CheckNetIsolation.exe LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

- Ensure BDS `server.properties` and `config/default/permissions.json` are configured for scripting when testing script-based behavior packs:
  - `server.properties`: set `scripting-enabled=true` and `experiments=beta_apis` (if required)
  - `config/default/permissions.json`: include allowed modules such as `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/server-net`

## Need help?

If you want, I can add:

- A `--server-wide` option to deploy packs to the server-wide pack folders.
- A `dry-run` mode to preview which files will be copied without writing.
- A small PowerShell helper script to start/stop a BDS instance and tail logs during development.

Open an issue or request here and I’ll implement the option you prefer.

## Saving Test Output (Markdown)

As part of the development workflow, test runs are saved automatically to a local `test/results/` folder in a Markdown-friendly format. This preserves a readable copy of the console output without tracking large or ephemeral files in source control.

- Location: `test/results/` (ignored by `.gitignore`)
- Filenames: `test-output-YYYYMMDD-HHMMSS.md`

These files are intended for local inspection and troubleshooting. They are not committed to the repository.
