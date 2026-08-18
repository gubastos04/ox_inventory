--[[
    3x3 "Minecraft-style" crafting workbench.

    Storage: reuses ox_inventory's own per-player stash system (owner = true)
    for the 9 grid slots — this gives us DB-backed persistence, weight
    tracking, drag-and-drop, and all the usual security checks for free,
    without touching any core inventory code. See RegisterStash below.

    Recipes: data/workbench_recipes.lua (shaped, 3x3, exact position match).

    Unlocking: a single generic 'blueprint' item (data/items.lua) carries
    which recipe(s) it grants in its metadata, e.g.:

        { recipes = { 'ak47_frame' } }

    — not in the item definition itself, so any script (loot tables, admin
    commands, quest rewards, ...) can hand out a blueprint for any recipe
    without ox_inventory needing to know about it in advance. Build that
    metadata with exports.ox_inventory:CreateBlueprintMetadata(recipeNames),
    or just call exports.ox_inventory:GiveBlueprint(source, recipeNames) to
    go straight to the player's inventory. See the bottom of this file for
    both, and how to spawn one as ground loot via CustomDrop.

    Using a blueprint item fires the standard 'ox_inventory:usedItem' server
    event (which every item use fires), which we listen for below.

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
local BLUEPRINT_ITEM = 'blueprint'

exports.ox_inventory:RegisterStash(STASH_NAME, STASH_LABEL, STASH_SLOTS, STASH_MAX_WEIGHT, true)

---@type table<string, WorkbenchRecipe>
local Recipes = {}

for _, recipe in pairs(lib.load('data.workbench_recipes') or {}) do
    Recipes[recipe.name] = recipe
end

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

    local rows = MySQL.query.await('SELECT `recipe` FROM `ox_player_recipes` WHERE `citizenid` = ?', { identifier }) or
        {}
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

    if not identifier then
        -- Antes: retornava em silêncio. Se inventory.owner vier nulo (bridge
        -- de framework não configurado certo, ou testando sem personagem
        -- carregado), o item era consumido mas nada era desbloqueado nem
        -- persistido — e não sobrava nenhum rastro pra saber o motivo.
        return warn(('unlockRecipes: getIdentifier retornou nil para source %s — inventory.owner não está setado (framework/bridge configurado?). Nada foi salvo.')
        :format(source))
    end

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
        local recipe = newlyUnlocked[i]

        -- Antes: MySQL.insert(query, params) sem callback — se o INSERT
        -- falhasse (ex.: tabela `ox_player_recipes` não existe porque
        -- sql/workbench_recipes.sql nunca foi rodado contra o banco), não
        -- aparecia nada no console. O jogador via "receita desbloqueada" e
        -- conseguia craftar na mesma sessão (o cache em memória em
        -- PlayerRecipes já tinha sido atualizado antes deste loop), mas ao
        -- relogar a receita sumia porque nunca foi de fato salva.
        MySQL.insert('INSERT IGNORE INTO `ox_player_recipes` (`citizenid`, `recipe`, `unlocked_at`) VALUES (?, ?, ?)',
            { identifier, recipe, now }, function(insertId)
                if not insertId then
                    warn(('unlockRecipes: falha ao persistir a receita "%s" para "%s" — confira se sql/workbench_recipes.sql foi executado no banco (tabela `ox_player_recipes` existe?) e o console do servidor no momento do INSERT.')
                    :format(recipe, identifier))
                end
            end)
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

AddEventHandler('ox_inventory:usedItem', function(invId, itemName, _, metadata)
    if itemName ~= BLUEPRINT_ITEM then return end

    local recipeNames = metadata and metadata.recipes

    if not recipeNames or #recipeNames == 0 then
        -- Malformed blueprint (created without going through the helpers
        -- below) — nothing to unlock, and nothing to charge the player for
        -- since the item is already consumed by this point.
        return warn(('a blueprint item was used with no metadata.recipes (source %s)'):format(invId))
    end

    -- Antes: usava o global `source`, que TriggerEvent (diferente de um
    -- RegisterNetEvent disparado direto pelo cliente) não garante estar
    -- setado — por isso vinha nil/vazio e getIdentifier falhava em
    -- silêncio, sem nada ser salvo. O primeiro parâmetro do evento já é o
    -- inventory.id de quem usou o item (equivalente ao source, pra
    -- inventário de jogador) — é isso que precisa ser usado aqui.
    unlockRecipes(invId, recipeNames, itemName)
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

--[[
    Blueprint generation helpers — for loot tables, admin commands, quest
    rewards, or anything else that needs to hand a player a blueprint for
    some recipe.
]]

---@param recipeNames string|string[] one recipe name, or a list to make a "pack" blueprint that unlocks several at once
---@return { recipes: string[], label: string }? metadata nil if none of the recipe names are valid
local function createBlueprintMetadata(recipeNames)
    if type(recipeNames) == 'string' then recipeNames = { recipeNames } end

    local labels = {}

    for i = 1, #recipeNames do
        local recipe = Recipes[recipeNames[i]]

        if not recipe then
            warn(('createBlueprintMetadata: unknown recipe "%s"'):format(recipeNames[i]))
        else
            labels[#labels + 1] = recipe.label
        end
    end

    if #labels == 0 then return end

    return {
        recipes = recipeNames,                    -- nomes internos, usados apenas server-side em matchRecipe/unlockRecipes
        recipeNames = table.concat(labels, ', '), -- string legível, é isso que o displayMetadata mostra no tooltip
        label = ('Blueprint: %s'):format(table.concat(labels, ', ')),
    }
end

exports('CreateBlueprintMetadata', createBlueprintMetadata)

---Gives a blueprint directly to a player's inventory.
---@param source number
---@param recipeNames string|string[]
---@return boolean success
local function giveBlueprint(source, recipeNames)
    local metadata = createBlueprintMetadata(recipeNames)
    if not metadata then return false end

    return Inventory.AddItem(source, BLUEPRINT_ITEM, 1, metadata) and true or false
end

exports('GiveBlueprint', giveBlueprint)

--[[
    To spawn one as loot on the ground / in a container instead of directly
    in a player's inventory, use the metadata with whatever you're already
    using to create that loot. With ox_inventory's own CustomDrop export:

        local metadata = exports.ox_inventory:CreateBlueprintMetadata('ak47_frame')

        exports.ox_inventory:CustomDrop('Blueprint', {
            { name = 'blueprint', count = 1, metadata = metadata },
        }, coords)
]]

-- Quick way to test without a loot table wired up yet:
-- /giveblueprint [recipe name, from data/workbench_recipes.lua]
-- Gate this behind an ace permission (or remove it) before going live.
lib.addCommand('giveblueprint', {
    help = 'Dev/test: gives yourself a blueprint for the given recipe',
    params = {
        { name = 'recipe', type = 'string', help = 'Recipe name from data/workbench_recipes.lua' },
    },
    restricted = 'group.admin',
}, function(source, args)
    if not giveBlueprint(source, args.recipe) then
        TriggerClientEvent('ox_lib:notify', source, {
            type = 'error',
            description = ('Receita "%s" não existe.'):format(args.recipe),
        })
    end
end)
