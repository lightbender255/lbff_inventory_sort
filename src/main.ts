import { system, Entity, ItemStack, Player } from '@minecraft/server'
import { log, logAndDisplay } from './logger'
// Entity is imported for type compatibility with some API shapes; it's intentionally unused in code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Entity = Entity

// Listen for the scriptevent command from the UI button
system.afterEvents.scriptEventReceive.subscribe((eventData) => {
  const { id, sourceEntity } = eventData
  log('INFO', 'Script event received', { id, sourceEntity: sourceEntity?.nameTag || 'unknown' })
  // Check for our custom event ID
  if (id === 'lbff:sort_inventory' && sourceEntity && sourceEntity instanceof Player) {
    logAndDisplay(sourceEntity, 'INFO', 'Inventory sort requested', { player: sourceEntity.nameTag })
    sortPlayerInventory(sourceEntity)
  }
}, { namespaces: ['lbff'] })

function sortPlayerInventory (player: Player) {
  log('INFO', 'Starting inventory sort', { player: player.nameTag })
  const inventoryComp = player.getComponent('minecraft:inventory')
  if (!inventoryComp) {
    logAndDisplay(player, 'ERROR', 'No inventory component found', undefined, '§c')
    return
  }
  const inventory = inventoryComp.container
  if (!inventory) {
    logAndDisplay(player, 'ERROR', 'No inventory container found', undefined, '§c')
    return
  }
  const items: ItemStack[] = []

  // 1. Read all items from inventory into an array
  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i)
    if (item) {
      items.push(item)
      inventory.setItem(i, undefined) // Clear the slot
    }
  }

  log('INFO', 'Items collected from inventory', { itemCount: items.length, inventorySize: inventory.size })

  // 2. Sort the array (e.g., by item ID)
  items.sort((a, b) => a.typeId.localeCompare(b.typeId))
  log('INFO', 'Items sorted by typeId')

  // 3. (Optional but Recommended) Consolidate stacks
  const consolidatedItems: ItemStack[] = []
  if (items.length > 0) {
    consolidatedItems.push(items[0])
    for (let i = 1; i < items.length; i++) {
      const lastItem = consolidatedItems[consolidatedItems.length - 1]
      // If items are the same and the last stack isn't full
      if (lastItem.isStackableWith(items[i]) && lastItem.amount < lastItem.maxAmount) {
        const transferAmount = Math.min(items[i].amount, lastItem.maxAmount - lastItem.amount)
        lastItem.amount += transferAmount
        items[i].amount -= transferAmount
        // If the current item stack isn't empty, add it as a new stack
        if (items[i].amount > 0) {
          consolidatedItems.push(items[i])
        }
      } else {
        consolidatedItems.push(items[i])
      }
    }
  }

  log('INFO', 'Items consolidated', { originalCount: items.length, consolidatedCount: consolidatedItems.length })

  // 4. Write sorted and consolidated items back to inventory
  consolidatedItems.forEach(item => {
    inventory.addItem(item)
  })

  logAndDisplay(player, 'INFO', 'Inventory sorted successfully', { finalItemCount: consolidatedItems.length }, '§a')
}

// No custom type definitions needed; use API types
