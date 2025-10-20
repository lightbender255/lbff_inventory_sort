import { system, Entity, ItemStack, Player } from "@minecraft/server";

// Listen for the scriptevent command from the UI button
system.afterEvents.scriptEventReceive.subscribe((eventData) => {
    const { id, sourceEntity } = eventData;
    // Check for our custom event ID
    if (id === "lbff:sort_inventory" && sourceEntity && sourceEntity instanceof Player) {
        sortPlayerInventory(sourceEntity);
    }
}, { namespaces: ["lbff"] });

function sortPlayerInventory(player: Player) {
    const inventoryComp = player.getComponent("minecraft:inventory");
    if (!inventoryComp) {
        player.sendMessage("§cNo inventory component found!");
        return;
    }
    const inventory = inventoryComp.container;
    if (!inventory) {
        player.sendMessage("§cNo inventory container found!");
        return;
    }
    const items: ItemStack[] = [];

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
    const consolidatedItems: ItemStack[] = [];
    if (items.length > 0) {
        consolidatedItems.push(items[0]);
        for (let i = 1; i < items.length; i++) {
            const lastItem = consolidatedItems[consolidatedItems.length - 1];
            // If items are the same and the last stack isn't full
            if (lastItem.isStackableWith(items[i]) && lastItem.amount < lastItem.maxAmount) {
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

// No custom type definitions needed; use API types
