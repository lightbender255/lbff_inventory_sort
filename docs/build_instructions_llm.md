# Minecraft Bedrock Addon Specification: Inventory Sorter

## 1\. Overview

This document provides the complete file structure and source code required to create an inventory sorting addon for Minecraft: Bedrock Edition. The addon will add a "Sort" button to the player's inventory screen. When clicked, a script will organize the player's main inventory, consolidating and sorting items by their item ID.

The addon uses the following identifiers:

  * **Script Event Namespace:** `lbff`
  * **Author:** `lightbender255`
  * **Project Name:** `lbff_bedrock_inventory_sorter`

The project requires Node.js and TypeScript for compilation.

## 2\. Project Structure

The project is a unified workspace. The TypeScript source code (`.ts`) resides in the `src/` directory and is compiled into JavaScript (`.js`) in the `lbff_bedrock_inventory_sorter_BP/scripts/` directory.

```plaintext
lbff_bedrock_inventory_sorter/
├── lbff_bedrock_inventory_sorter_BP/
│   ├── manifest.json
│   └── scripts/
│       └── (This folder is initially empty. 'main.js' will be generated here by compiling)
│
├── lbff_bedrock_inventory_sorter_RP/
│   ├── manifest.json
│   └── ui/
│       └── inventory_screen.json
│
├── src/
│   └── main.ts
│
├── package.json
└── tsconfig.json
```

## 3\. File Contents

Below is the exact content for each file.

-----

### `package.json`

*(Located at: `lbff_bedrock_inventory_sorter/package.json`)*
This file manages project dependencies and scripts.

```json
{
  "name": "lbff-inventory-sorter",
  "version": "1.0.0",
  "description": "Inventory Sorter Addon for Minecraft: Bedrock Edition",
  "author": "lightbender255",
  "scripts": {
    "build": "npx tsc"
  },
  "devDependencies": {
    "@minecraft/server": "^1.7.0",
    "typescript": "^5.2.2"
  }
}
```

-----

### `tsconfig.json`

*(Located at: `lbff_bedrock_inventory_sorter/tsconfig.json`)*
This file configures the TypeScript compiler. **Note the updated `outDir` path.**

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2020",
    "moduleResolution": "node",
    "strict": true,
    "noEmitOnError": true,
    "rootDir": "./src",
    "outDir": "./lbff_bedrock_inventory_sorter_BP/scripts"
  },
  "include": [
    "./src/**/*.ts"
  ]
}
```

-----

### `src/main.ts`

*(Located at: `lbff_bedrock_inventory_sorter/src/main.ts`)*
This is the TypeScript source code that contains all sorting logic.

```typescript
import { world, system, Player, ItemStack } from "@minecraft/server";

/**
 * Listen for the scriptevent command from the UI button
 */
system.afterEvents.scriptEventReceive.subscribe(eventData => {
    const { id, sourceEntity } = eventData;

    // Check for our custom event ID and ensure the source is a Player
    if (id === "lbff:sort_inventory" && sourceEntity instanceof Player) {
        sortPlayerInventory(sourceEntity);
    }
}, { namespaces: ["lbff"] });

/**
 * Sorts the player's inventory container.
 * @param {Player} player The player to sort.
 */
function sortPlayerInventory(player: Player) {
    const inventory = player.getComponent("inventory").container;
    const items: ItemStack[] = [];

    // 1. Read all items from main inventory (slots 9-35) into an array.
    // This avoids sorting the hotbar (slots 0-8).
    for (let i = 9; i < 36; i++) {
        const item = inventory.getItem(i);
        if (item) {
            items.push(item);
            inventory.setItem(i, undefined); // Clear the slot
        }
    }

    if (items.length === 0) {
        player.sendMessage("§7No items to sort.");
        return;
    }

    // 2. Sort the array by item ID string
    items.sort((a, b) => a.typeId.localeCompare(b.typeId));

    // 3. Consolidate stacks
    const consolidatedItems: ItemStack[] = [];
    if (items.length > 0) {
        let currentStack = items[0];

        for (let i = 1; i < items.length; i++) {
            const nextItem = items[i];

            if (currentStack.isStackableWith(nextItem) && currentStack.amount < currentStack.maxAmount) {
                // We can add to the current stack
                const transferAmount = Math.min(nextItem.amount, currentStack.maxAmount - currentStack.amount);
                currentStack.amount += transferAmount;
                nextItem.amount -= transferAmount;

                // If the next item stack still has items, it becomes the new current stack
                if (nextItem.amount > 0) {
                    consolidatedItems.push(currentStack);
                    currentStack = nextItem;
                }
            } else {
                // Items are not stackable, push the current stack and move to the next
                consolidatedItems.push(currentStack);
                currentStack = nextItem;
            }
        }
        // Add the last working stack
        consolidatedItems.push(currentStack);
    }

    // 4. Write sorted and consolidated items back to inventory slots 9-35.
    for (let i = 0; i < consolidatedItems.length; i++) {
        const slotIndex = i + 9; // Start at slot 9
        if (slotIndex > 35) break; // Stop if we run out of space
        inventory.setItem(slotIndex, consolidatedItems[i]);
    }

    player.sendMessage("§aInventory sorted!");
}
```

-----

### `lbff_bedrock_inventory_sorter_BP/manifest.json`

*(Located at: `lbff_bedrock_inventory_sorter_BP/manifest.json`)*
This is the manifest for the Behavior Pack. New UUIDs must be generated for the `uuid` fields.

```json
{
  "format_version": 2,
  "header": {
    "name": "lbff Bedrock Inventory Sorter BP",
    "description": "Sorts the player inventory. (Author: lightbender255)",
    "uuid": "[GENERATE-UUID-1]",
    "version": [1, 0, 0],
    "min_engine_version": [1, 20, 30]
  },
  "modules": [
    {
      "type": "script",
      "language": "javascript",
      "uuid": "[GENERATE-UUID-2]",
      "version": [1, 0, 0],
      "entry": "scripts/main.js"
    }
  ],
  "dependencies": [
    {
      "module_name": "@minecraft/server",
      "version": "1.7.0"
    }
  ]
}
```

-----

### `lbff_bedrock_inventory_sorter_RP/manifest.json`

*(Located at: `lbff_bedrock_inventory_sorter_RP/manifest.json`)*
This is the manifest for the Resource Pack. New UUIDs must be generated for the `uuid` fields.

```json
{
  "format_version": 2,
  "header": {
    "name": "lbff Bedrock Inventory Sorter RP",
    "description": "Adds a sort button to the inventory screen. (Author: lightbender255)",
    "uuid": "[GENERATE-UUID-3]",
    "version": [1, 0, 0],
    "min_engine_version": [1, 20, 30]
  },
  "modules": [
    {
      "type": "resources",
      "uuid": "[GENERATE-UUID-4]",
      "version": [1, 0, 0]
    }
  ]
}
```

-----

### `lbff_bedrock_inventory_sorter_RP/ui/inventory_screen.json`

*(Located at: `lbff_bedrock_inventory_sorter_RP/ui/inventory_screen.json`)*
This is a minimal UI file that *modifies* the vanilla inventory screen, adding the sort button. It does not replace the entire file, making it robust against game updates.

```json
{
  // Target the vanilla inventory panel to modify it
  "inventory_panel@common.inventory_panel": {
    // Use the modifications array to add our button
    "modifications": [
      {
        "control_name": "lbff_sort_button", // This is the unique name of our new control
        "operation": "add_first_child", // Add it to the "controls" array of "inventory_panel"
        "data": { // This is the definition of the control to add
          "lbff_sort_button@common.button": {
            "size": [ 30, 12 ], // [width, height] in pixels
            "anchor_from": "top_left",
            "anchor_to": "top_left",
            "offset": [ 80, 5 ], // [from left, from top] in pixels
            "$pressed_button_name": "button.execute_command",
            "$button_text": "Sort", // Use text, no texture needed

            // --- Bind the button click to our script event ---
            "bindings": [
              {
                "binding_name": "#execute_command",
                "binding_name_override": "#command_string",
                "binding_condition": "always_when_visible"
              },
              {
                "binding_name": "#command_string",
                "binding_type": "collection",
                "collection_name": "client_commands",
                "binding_condition": "always_when_visible",
                "collection_details": {
                  "command": "/scriptevent lbff:sort_inventory"
                }
              }
            ]
          }
        }
      }
    ]
  }
}
```

## 4\. Compilation and Deployment

1.  **Install Dependencies:** Run `npm install` in the `lbff_bedrock_inventory_sorter` root directory.
2.  **Compile:** Run `npm run build` (or `npx tsc`) to compile the `src/main.ts` file into `lbff_bedrock_inventory_sorter_BP/scripts/main.js`.
3.  **Deploy:** Copy the `lbff_bedrock_inventory_sorter_BP` and `lbff_bedrock_inventory_sorter_RP` folders into your Minecraft `development_behavior_packs` and `development_resource_packs` folders.
4.  **Activate:** Apply both packs to a new or existing world.