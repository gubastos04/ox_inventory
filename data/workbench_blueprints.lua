--[[
    Maps a blueprint item (as defined in data/items.lua) to the workbench
    recipe(s) (by `name`, from data/workbench_recipes.lua) it unlocks for the
    player who uses it. A blueprint can unlock a single recipe or several at
    once — both are supported, just list however many you need.
]]

return {
    ['blueprint_ak47'] = { 'ak47_frame' },
    ['blueprint_weapons_pack'] = { 'ak47_frame', 'bandage_kit' },
}
