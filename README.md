# Lightbender's Inventory Sorter

Minecraft: Bedrock Edition addon that sorts a player's inventory with a single action.

## For Players — Install & Use

This addon is provided as a Behavior Pack / Resource Pack pair and will be packaged as a single `.mcaddon` file for easy installation.

Installation steps (player):

1. Download the `.mcaddon` file (packaged addon) from the release or distribution page.
2. Double-click the `.mcaddon` file on Windows — Minecraft will import the pack and open the game.
3. In Minecraft, create or open a world, then enable the Behavior Pack and Resource Pack in the world settings.
4. Start the world and use the provided UI or command bindings to sort your inventory.

Notes for server admins:

- For Bedrock Dedicated Server (BDS) installs, copy the behavior pack and resource pack into the server's `behavior_packs/` and `resource_packs/` folders and add the pack to the target world's `world_behavior_packs.json`.
- Ensure scripting is enabled and experimental APIs are configured if the addon uses them.

## Quick troubleshooting (player)

- If the pack doesn't appear in the world, verify the pack is enabled in the world `Behavior Packs` settings.
- If scripts don't run on a server, verify server's `server.properties` has `scripting-enabled=true` and `experiments=beta_apis` (if required), and that `config/default/permissions.json` allows `@minecraft/server`.

## Packaging

The final distributable for players will be a `.mcaddon` file which bundles the behavior and resource packs into a single importable package.

If you'd like me to create the `.mcaddon` packaging step in this repository (build script), I can add it and wire it into `npm run build`.
