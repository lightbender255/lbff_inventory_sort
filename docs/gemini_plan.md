# GEMINI chat log planning the add-on

Here is a plan to create an inventory sorting addon for Minecraft: Bedrock Edition.

This project requires a Behavior Pack for the logic and a Resource Pack for the UI button. The communication between the client-side UI button and the server-side script is best handled using the /scriptevent command.

The middle-mouse button functionality you mentioned is not directly feasible with the current Scripting API, as there isn't an event for detecting that specific input. The UI button is the most reliable method.

## Behavior Pack (BP)
The Behavior Pack will contain the script that executes the sorting logic.

### manifest.json

Your manifest needs to declare the script module and its dependencies.

```JSON
{
  "format_version": 2,
  "header": {
    "name": "Inventory Sorter Behavior Pack",
    "description": "Sorts the player inventory.",
    "uuid": "<UUID-1>", // Generate new UUIDs
    "version": [1, 0, 0],
    "min_engine_version": [1, 20, 30]
  },
  "modules": [
    {
      "type": "script",
      "language": "javascript",
      "uuid": "<UUID-2>", // Generate new UUIDs
      "version": [1, 0, 0],
      "entry": "scripts/main.js"
    }
  ],
  "dependencies": [
    {
      "module_name": "@minecraft/server",
      "version": "1.5.0" // Or newer
    }
  ]
}
```

### scripts/main.js

This script listens for the event triggered by the UI button and performs the sort.

```JavaScript

import { world, system } from "@minecraft/server";

// Listen for the scriptevent command from the UI button
system.afterEvents.scriptEventReceive.subscribe(eventData => {
    const { id, sourceEntity } = eventData;

    // Check for our custom event ID
    if (id === "lbff:sort_inventory" && sourceEntity) {
        sortPlayerInventory(sourceEntity);
    }
}, { namespaces: ["lbff"] });

function sortPlayerInventory(player) {
    const inventory = player.getComponent("inventory").container;
    const items = [];

    // 1. Read all items from inventory into an array
    for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (item) {
            items.push(item);
            inventory.setItem(i, undefined); // Clear the slot
        }
    }

    // 2. Sort the array (e.g., by item ID)
    items.sort((a, b) => a.typeId.localeCompare(b.typeId));

    // 3. (Optional but Recommended) Consolidate stacks
    const consolidatedItems = [];
    if (items.length > 0) {
        consolidatedItems.push(items[0]);
        for (let i = 1; i < items.length; i++) {
            const lastItem = consolidatedItems[consolidatedItems.length - 1];
            // If items are the same and the last stack isn't full
            if (items[i].isStackableWith(lastItem) && lastItem.amount < lastItem.maxAmount) {
                const transferAmount = Math.min(items[i].amount, lastItem.maxAmount - lastItem.amount);
                lastItem.amount += transferAmount;
                items[i].amount -= transferAmount;
                // If the current item stack isn't empty, add it as a new stack
                if (items[i].amount > 0) {
                    consolidatedItems.push(items[i]);
                }
            } else {
                consolidatedItems.push(items[i]);
            }
        }
    }

    // 4. Write sorted and consolidated items back to inventory
    consolidatedItems.forEach(item => {
        inventory.addItem(item);
    });

    player.sendMessage("§aInventory sorted!");
}
```

## Resource Pack (RP)

The Resource Pack will add the button to the inventory screen.

Create a UI file (e.g., `ui/inventory_screen.json`). You'll need to copy the vanilla `inventory_screen.json` and add your button to it.

Add a button element to the controls section of the JSON file.

Here is a simplified snippet of what to add inside the `inventory_screen.json:`

```JSON
"sort_button@common.button": {
  "size": [ 12, 12 ],
  "anchor_from": "top_left",
  "anchor_to": "top_left",
  "offset": [ 80, 5 ], // Adjust position as needed
  "$pressed_button_name": "button.execute_command",
  "$button_text": "Sort", // Or use a texture
  "bindings": [
    {
      "binding_name": "#execute_command",
      "binding_name_override": "#command_string",
      "binding_condition": "always_when_visible",
      "ignored": false
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
```

You would then add `"sort_button@common.button": {}` to the main panel's controls array in `inventory_screen.json`. You'll also need a ***`manifest.json`*** for the RP.

This setup provides a complete solution for a server-authoritative inventory sort initiated from the client UI. Good luck!

-- Created by Google Gemini and lightbender255 on 2025-10-20