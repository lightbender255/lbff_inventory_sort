# Mojang Minecraft Bedrock Debugger For Visual Studio Code

This document explains how to debug Minecraft Bedrock scripts with Visual Studio Code. It covers UWP (client) debugging and Bedrock Dedicated Server (BDS) debugging, plus useful extension features and diagnostics.

## Prepare UWP Loopback Exemption

When debugging the UWP Minecraft client on the same machine as VS Code, you usually need a loopback exemption so the client can connect to local debugging services. Run the appropriate command in an elevated prompt:

Minecraft Bedrock (stable):

```powershell
CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-1958404141-86561845-1752920682-3514627264-368642714-62675701-733520436
```

Minecraft Bedrock Preview:

```powershell
CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-424268864-5579737-879501358-346833251-474568803-887069379-4040235476
```

> Note: Running these commands requires Administrator privileges.

## UWP Loopback Exemption (Administrator Required)

If VS Code cannot attach to the UWP Minecraft client, add a loopback exemption for the UWP package so it may connect to local services.

1. Open PowerShell as Administrator (right-click PowerShell -> Run as Administrator).
2. Run the appropriate CheckNetIsolation command for your installed Minecraft package. Example for the stable build:

```powershell
CheckNetIsolation.exe LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

To remove the exemption later:

```powershell
CheckNetIsolation.exe LoopbackExempt -r -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

Alternately, run the project's development orchestrator script with `-Loopback:$true` from an elevated PowerShell; it attempts to add the exemption automatically.

## Open Visual Studio Code At The Behavior Pack Root

Open VS Code in the folder that contains your behavior pack or source tree so breakpoints and paths resolve correctly. Typical locations:

- UWP development behavior packs:

  `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\<your_bp>`

- Or your project workspace (e.g., `C:\projects\myaddon`).

## Configure launch.json For Client Debugging

For plain JavaScript (no build step) add a `.vscode/launch.json` like this:

```json
{
  "version": "0.3.0",
  "configurations": [
    {
      "type": "minecraft-js",
      "request": "attach",
      "name": "Debug with Minecraft (Client)",
      "mode": "listen",
      "preLaunchTask": "build",
      "targetModuleUuid": "<your-script-module-uuid>",
      "localRoot": "${workspaceFolder}/",
      "port": 19144
    }
  ]
}
```

- `localRoot` should point to the folder containing your behavior pack scripts.
- Port `19144` is the default client script-debugging port.
- `targetModuleUuid` (optional) should match the script module UUID in `manifest.json` when multiple script packs are active.

## Configure launch.json For TypeScript Projects

If your build emits JavaScript and source maps, include mapping settings so breakpoints map back to TypeScript:

```json
{
  "version": "0.3.0",
  "configurations": [
    {
      "type": "minecraft-js",
      "request": "attach",
      "name": "Debug with Minecraft (Client - TS)",
      "mode": "listen",
      "preLaunchTask": "build",
      "targetModuleUuid": "<your-script-module-uuid>",
      "sourceMapRoot": "${workspaceFolder}/dist/debug/",
      "generatedSourceRoot": "${workspaceFolder}/dist/scripts/",
      "port": 19144
    }
  ]
}
```

## Start Client Debugging

1. In VS Code, open the Run and Debug view and select your Minecraft configuration (or press F5). VS Code will listen for a connection.
2. Start Minecraft and load a world that has your behavior pack enabled.
3. In Minecraft chat, run:

```text
/script debugger connect
```

When the connection succeeds Minecraft shows "Debugger connected to host". Set breakpoints in VS Code to inspect script execution.

## Debugging With Bedrock Dedicated Server (BDS)

BDS can listen for debug connections while VS Code connects to it. Configure the server and then start the listener from the server console.

### Server Configuration

Edit `server.properties` to enable debugging options as needed:

- `allow-outbound-script-debugging=true` — enables `/script debugger connect`.
- `allow-inbound-script-debugging=true` — enables `/script debugger listen`.
- `force-inbound-debug-port=<port>` — lock the debug port (optional).

### Start Server Listener

From the BDS console run:

```text
/script debugger listen 19144
```

You should see a "Debugger listening" response.

### VS Code Launch Config For BDS

Use `mode: "connect"` for VS Code to connect to the server listener:

```json
{
  "version": "0.3.0",
  "configurations": [
    {
      "type": "minecraft-js",
      "request": "attach",
      "name": "Debug with Minecraft (BDS)",
      "mode": "connect",
      "preLaunchTask": "build",
      "sourceMapRoot": "${workspaceFolder}/dist/debug/",
      "generatedSourceRoot": "${workspaceFolder}/dist/scripts/",
      "port": 19144
    }
  ]
}
```

## Minecraft Debugger Extension Features

The Minecraft Debugger extension offers:

- A home panel with shortcuts and quick actions.
- Command shortcuts for common Minecraft operations.
- A Script Profiler (Start/Stop captures) — configure local save path.
- Diagnostics window (server stats, script runtime metrics) on supported server versions.

To view diagnostics run **Minecraft Diagnostics: Show** or open the extension panel.

## Diagnostics And Metrics

When available, the diagnostics panel includes:

- Number of entities (all dimensions)
- Chunk loaded state (per dimension)
- Commands run per tick by category
- Minecraft executable memory usage
- Scripting runtime memory usage
- Server tick timing breakdown (target 20 Hz / 50 ms)
- Network packet bandwidth and counts
- Entity handle counts per scripting pack (useful to detect leaks)

## References

- [Minecraft Bedrock Modding Docs](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable)
- LBFF Inventory Sorter Dev Tools: README and `scripts/` in this repository

If you want, I can add a ready-to-run `.vscode/launch.json` tuned for this addon or a small PowerShell helper to add the loopback exemption.
