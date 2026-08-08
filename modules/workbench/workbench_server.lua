--[[
    3x3 "Minecraft-style" crafting workbench.

    Storage: reuses ox_inventory's own per-player stash system (owner = true)
    for the 9 grid slots — this gives us DB-backed persistence, weight
    tracking, drag-and-drop, and all the usual security checks for free,
    without touching any core inventory code. See RegisterStash below.

    Recipes: data/workbench_recipes.lua (shaped, 3x3, exact position match).
    Unlocking: data/workbench_blueprints.lua maps a blueprint item to the
    recipe(s) it grants. Using a blueprint item fires the standard
    'ox_inventory:usedItem' server event, which we listen for below.

    Persistence: unlocked recipes are stored in `ox_player_recipes`
    (see sql/workbench_recipes.sql), keyed by the player's framework
    identifier (inventory.owner — citizenid for QBox/QBCore).
]]

if not lib then return end

local Inventory = require 'modules.inventory.server'
local Items = require 'modules.items.server'

local STASH_NAME = 'workbench'
local STASH_LABEL = 'Bancada de Craft'
local STASH_SLOTS = 9
local STASH_MAX_WEIGHT = 900000 -- 900kg; generous so placing materials never blocks on weight

exports.ox_inventory:RegisterStash(STASH_NAME, STASH_LABEL, STASH_SLOTS, STASH_MAX_WEIGHT, true)

---@type table<string, WorkbenchRecipe>
local Recipes = {}

for _, recipe in pairs(lib.load('data.workbench_recipes') or {}) do
    Recipes[recipe.name] = recipe
end

---@type table<string, string[]>
local Blueprints = lib.load('data.workbench_blueprints') or {}

-- source -> { [recipeName] = true }, populated lazily and dropped on disconnect
local PlayerRecipes = {}

---@param source number
---@return string?
local function getIdentifier(source)
    local inventory = Inventory(source)
    return inventory and inventory.owner --[[@as string?]]
end

---@param source number
---@return table<string, true>
local function loadPlayerRecipes(source)
    local identifier = getIdentifier(source)
    if not identifier then return {} end

    local cached = PlayerRecipes[source]
    if cached then return cached end

    local rows = MySQL.query.await('SELECT `recipe` FROM `ox_player_recipes` WHERE `citizenid` = ?', { identifier }) or {}
    local unlocked = {}

    for i = 1, #rows do
        unlocked[rows[i].recipe] = true
    end

    PlayerRecipes[source] = unlocked
    return unlocked
end

---@param source number
---@param recipeNames string[]
---@param sourceItem string?
local function unlockRecipes(source, recipeNames, sourceItem)
    local identifier = getIdentifier(source)
    if not identifier then return end

    local unlocked = loadPlayerRecipes(source)
    local newlyUnlocked = {}

    for i = 1, #recipeNames do
        local name = recipeNames[i]

        if Recipes[name] and not unlocked[name] then
            unlocked[name] = true
            newlyUnlocked[#newlyUnlocked + 1] = name
        end
    end

    if #newlyUnlocked == 0 then
        return TriggerClientEvent('ox_lib:notify', source, {
            type = 'inform',
            description = 'Você já conhece todas as receitas deste blueprint.',
        })
    end

    local now = os.time()

    for i = 1, #newlyUnlocked do
        MySQL.insert('INSERT IGNORE INTO `ox_player_recipes` (`citizenid`, `recipe`, `unlocked_at`) VALUES (?, ?, ?)',
            { identifier, newlyUnlocked[i], now })
    end

    local labels = {}

    for i = 1, #newlyUnlocked do
        labels[i] = Recipes[newlyUnlocked[i]].label
    end

    TriggerClientEvent('ox_lib:notify', source, {
        type = 'success',
        title = 'Nova(s) receita(s) desbloqueada(s)',
        description = table.concat(labels, ', '),
    })
end

AddEventHandler('ox_inventory:usedItem', function(_, itemName, _, _)
    local recipeNames = Blueprints[itemName]
    if not recipeNames then return end

    -- 'ox_inventory:usedItem' runs in the same invocation context as the
    -- player who triggered the item use, so `source` here is theirs.
    unlockRecipes(source, recipeNames, itemName)
end)

AddEventHandler('playerDropped', function()
    PlayerRecipes[source] = nil
end)

---Returns the recipes the player has unlocked, formatted for the frontend
---(shape + result only — no need to leak the full recipe table).
lib.callback.register('ox_inventory:getWorkbenchRecipes', function(source)
    local unlocked = loadPlayerRecipes(source)
    local list = {}

    for name in pairs(unlocked) do
        local recipe = Recipes[name]

        if recipe then
            list[#list + 1] = {
                name = recipe.name,
                label = recipe.label,
                grid = recipe.grid,
                result = recipe.result,
            }
        end
    end

    return list
end)

---@param grid table<number, string|false> current contents of the 9 workbench slots, indexed 1-9
---@return WorkbenchRecipe?
local function matchRecipe(unlocked, grid)
    for name in pairs(unlocked) do
        local recipe = Recipes[name]
        if not recipe then goto continue end

        local matches = true

        for i = 1, 9 do
            if (recipe.grid[i] or false) ~= (grid[i] or false) then
                matches = false
                break
            end
        end

        if matches then return recipe end

        ::continue::
    end
end

---Authoritative craft: re-reads the actual stash contents, re-matches
---against the player's unlocked recipes (never trusts the client's claim),
---removes the ingredients and grants the result.
---@param source number
---@param recipeName string expected result, purely to give a clear error if state changed underneath the player
lib.callback.register('ox_inventory:craftWorkbench', function(source, recipeName)
    local left = Inventory(source)
    if not left then return false, 'error' end

    local identifier = left.owner
    local stash = Inventory(('%s:%s'):format(STASH_NAME, identifier))
    if not stash then return false, 'error' end

    local unlocked = loadPlayerRecipes(source)
    local grid = {}

    for slot = 1, 9 do
        local item = stash.items[slot]
        grid[slot] = item and item.name or false
    end

    local recipe = matchRecipe(unlocked, grid)

    if not recipe or recipe.name ~= recipeName then
        return false, 'recipe_mismatch'
    end

    local resultItem = Items(recipe.result.name)
    if not resultItem then return false, 'error' end

    local count = recipe.result.count
    count = type(count) == 'table' and math.random(count[1], count[2]) or count --[[@as number]]

    if not Inventory.CanCarryItem(left, resultItem, count) then
        return false, 'cannot_carry'
    end

    for slot = 1, 9 do
        local item = stash.items[slot]
        if item then
            -- Minecraft-style: each craft consumes exactly 1 unit from every
            -- occupied cell, not the whole stack sitting in that slot — so a
            -- stack of 5 iron lets you craft 5 times without refilling.
            local removed = Inventory.RemoveItem(stash, item.name, 1, item.metadata, slot)
            if not removed then return false, 'error' end
        end
    end

    Inventory.AddItem(left, resultItem, count)

    return true
end)
