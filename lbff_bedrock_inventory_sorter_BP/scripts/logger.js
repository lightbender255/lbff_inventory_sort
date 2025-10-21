'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.log = log
exports.displayOnHUD = displayOnHUD
exports.logAndDisplay = logAndDisplay
/**
 * Development Logger Utility
 * Provides decoupled logging and HUD display functionality for Minecraft Bedrock addons.
 * Designed for AI-readable logs and in-game feedback during development.
 */
// Configuration
const DEV_MODE = true // Set to false in production to disable logging and HUD messages
/**
 * Logs a message to console with structured format for AI readability.
 * @param level - Log level (e.g., 'INFO', 'WARN', 'ERROR')
 * @param message - The message to log
 * @param data - Optional additional data (object, array, etc.)
 */
function log (level, message, data) {
  if (!DEV_MODE) { return }
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(data && { data })
  }
  console.log(`[DEV_LOG] ${JSON.stringify(logEntry, null, 2)}`)
}
/**
 * Displays a message on the player's HUD (via chat message).
 * @param player - The player to display the message to
 * @param message - The message to display
 * @param color - Optional color code (e.g., '§a' for green, '§c' for red)
 */
function displayOnHUD (player, message, color = '§e') {
  if (!DEV_MODE) { return }
  player.sendMessage(`${color}[DEV] ${message}`)
}
/**
 * Combined logging and HUD display.
 * @param player - The player to display to (optional, if null, only logs)
 * @param level - Log level
 * @param message - The message
 * @param data - Optional data for logging
 * @param hudColor - Optional HUD color
 */
function logAndDisplay (player, level, message, data, hudColor = '§e') {
  log(level, message, data)
  if (player) {
    displayOnHUD(player, message, hudColor)
  }
}
