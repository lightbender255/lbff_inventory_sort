# Debugging Minecraft Bedrock Addons

## Overview

This guide provides step-by-step instructions for connecting to a Minecraft Bedrock Edition script-host debug session using either the Mojang Minecraft Debugger extension or the Node.js debugger in VS Code. Follow these steps to reliably start a debug session for the `lbff_inventory_sort` addon.


## Prerequisites

- Minecraft Bedrock Edition (UWP) installed
- Bedrock Dedicated Server (BDS) or UWP world with scripting enabled
- Addon packs copied to the correct development folders
- VS Code installed
- Node.js installed
- (Optional) Mojang Minecraft Debugger extension installed in VS Code

---

## 1. Prepare the Environment

1. **Copy Addon Packs and Generate Launch Config**
    - Open a terminal in the addon root directory:

       ```pwsh
       cd d:\src\game_modding\Minecraft\bedrock\lbff\add-ons\inventory_add-ons\lbff_inventory_sort
       ./scripts/dev_debug_setup.ps1
       ```

    - This script will:
       - Copy the behavior/resource packs to the UWP development folders
       - Generate `.vscode/launch.json` with debug configurations
       - Ensure loopback exemption is set (required for UWP debug)
       - Tail the latest ContentLog and wait for the server to start

2. **Start Minecraft Bedrock (UWP)**
    - Launch Minecraft from the Start menu.
    - Load the world where the addon is installed.


## 2. Debugging with the Mojang Minecraft Debugger Extension

> **Note:** This method requires the Mojang Minecraft Debugger extension to be installed and recognized by VS Code. If you encounter issues, use the Node.js debugger method below.

### Steps

1. **Verify Extension Installation**
    - In VS Code, go to Extensions (`Ctrl+Shift+X`) and search for `Minecraft Debugger`.
   - Ensure it is installed and enabled.

2. **Open the Addon Project in VS Code**
   - Open the folder: `d:\src\game_modding\Minecraft\bedrock\lbff\add-ons\inventory_add-ons\lbff_inventory_sort`

3. **Select the Debug Configuration**
    - Open the Run and Debug panel (`Ctrl+Shift+D`).
   - Select `Attach using Minecraft Debugger Extension (if installed)` from the dropdown.

4. **Start the Debugger**
   - Click the green play button (`Start Debugging`).
   - When prompted, enter the debug port (default: `4711`).

5. **Connect from Minecraft**
    - In-game, open the chat and run:

       ```none
       /script debugger connect localhost 4711
       ```
   - You should see a connection confirmation in VS Code.


## 3. Debugging with the Node.js Debugger

> **Recommended if the Minecraft Debugger extension is not recognized or not working.**

### Steps

1. **Open the Addon Project in VS Code**
    - Open the folder: `d:\src\game_modding\Minecraft\bedrock\lbff\add-ons\inventory_add-ons\lbff_inventory_sort`

2. **Select the Debug Configuration**
   - Open the Run and Debug panel (`Ctrl+Shift+D`).
   - Select `Attach to Bedrock Script Host (node)` from the dropdown.

3. **Start the Debugger**
   - Click the green play button (`Start Debugging`).
   - When prompted, enter the debug port (default: `4711`).

4. **Connect from Minecraft**
    - In-game, open the chat and run:

       ```none
       /script debugger connect localhost 4711
       ```
   - You should see a connection confirmation in VS Code.


## 4. Troubleshooting

- **Debugger Fails to Attach:**
  - Ensure the correct port is used (default: 4711 for Bedrock script host).
  - Make sure loopback exemption is enabled:

      ```pwsh
      CheckNetIsolation.exe LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
      ```
  - Confirm that the packs are copied to the correct development folders.
  - Restart Minecraft and VS Code if issues persist.

- **Extension Not Recognized:**
  - Use the Node.js debugger method as a fallback.


## 5. References

- [Microsoft Bedrock Modding Documentation](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable)
- Project scripts: `scripts/dev_debug_setup.ps1`, `scripts/copy_packs.js`, `scripts/prepare_launch_json.js`
- Log files: `C:\Users\das_v\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\logs`


*Last updated: 2025-10-21*
