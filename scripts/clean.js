const rimraf = require('rimraf');
const paths = [
  'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/InventorySorter_BP',
  'C:/Users/das_v/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs/InventorySorter_RP'
];

paths.forEach((p) => {
  rimraf.sync(p);
});
