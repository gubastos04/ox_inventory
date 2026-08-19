--[[
    Tetris-style grid placement — used for the player inventory (outside the
    hotbar) and the right-side context panel (drop/container/stash/trunk/
    glovebox). NOT used for the hotbar itself (player slots 1..HOTBAR_SIZE)
    or the 3x3 crafting grid — those stay simple 1-item-per-slot regardless
    of an item's declared size (an item bigger than 1x1 placed there just
    behaves as 1x1, per design).

    IMPORTANT: GRID_COLS and HOTBAR_SIZE below must stay in sync with the
    frontend (web/src/components/inventory/InventoryGrid.tsx — same-named
    consts). There's no shared source of truth between Lua and TypeScript
    here, so if you change one, change the other.
]]

local Items = require 'modules.items.server'

local GRID_COLS = 9
local HOTBAR_SIZE = 9

local TETRIS_TYPES = {
    player = true,
    drop = true,
    newdrop = true,
    container = true,
    stash = true,
    trunk = true,
    glovebox = true,
}

-- The 3x3 crafting workbench (modules/workbench/server.lua) is, under the
-- hood, a personal 'stash' named 'workbench:<identifier>' — it must stay a
-- plain 1-slot-per-cell grid regardless of that, so it's excluded here by
-- id prefix rather than type.
local function isExcludedStash(invId)
    return type(invId) == 'string' and invId:find('^workbench:') ~= nil
end

local Grid = {}

---@param inventory table server-side Inventory object
---@return boolean
function Grid.isTetrisType(inventory)
    return TETRIS_TYPES[inventory.type] == true and not isExcludedStash(inventory.id)
end

---Returns an item's grid footprint. Defaults to 1x1 if the item has no
---`grid` field set in data/items.lua.
---@param itemName string
---@return integer width, integer height
function Grid.getItemSize(itemName)
    local item = Items(itemName)
    local grid = item and item.grid
    if not grid then return 1, 1 end
    return grid.width or 1, grid.height or 1
end

---@param inventory table server-side Inventory object
---@param slot number
---@return boolean
function Grid.isTetrisSlot(inventory, slot)
    if not Grid.isTetrisType(inventory) then return false end
    if inventory.type == 'player' and slot <= HOTBAR_SIZE then return false end
    return true
end

---Cells (slot numbers) an item of size w x h anchored at `slot` would
---occupy, reading left-to-right then top-to-bottom same as the frontend
---grid. Returns nil if that footprint would run off the right edge of the
---row it starts on (items never wrap mid-row).
---@param slot number
---@param w integer
---@param h integer
---@return number[]?
function Grid.getOccupiedCells(slot, w, h)
    if w <= 1 and h <= 1 then return { slot } end

    local col = (slot - 1) % GRID_COLS
    local row = (slot - 1 - col) / GRID_COLS

    if col + w > GRID_COLS then return nil end

    local cells = {}
    local n = 0

    for dy = 0, h - 1 do
        for dx = 0, w - 1 do
            n = n + 1
            cells[n] = (row + dy) * GRID_COLS + (col + dx) + 1
        end
    end

    return cells
end

---Whether an item of size w x h can be placed at `anchorSlot` in
---`inventory` — every cell it would occupy must be free of any OTHER
---item's footprint (an item is only stored under its own anchor slot, so
---coverage for every other cell it spans has to be derived, not looked up
---directly).
---@param inventory table server-side Inventory object
---@param anchorSlot number
---@param w integer
---@param h integer
---@param ignoreSlot number? the mover's own current anchor slot (same inventory only) — never collides with itself
---@return boolean fits
function Grid.canPlace(inventory, anchorSlot, w, h, ignoreSlot)
    if not Grid.isTetrisSlot(inventory, anchorSlot) then
        -- legacy 1-item-per-slot area (hotbar, or a non-tetris inventory
        -- type entirely) — no footprint math, just "is this slot empty"
        local occupant = inventory.items[anchorSlot]
        return not occupant or anchorSlot == ignoreSlot
    end

    local cells = Grid.getOccupiedCells(anchorSlot, w, h)
    if not cells then return false end

    for i = 1, #cells do
        if cells[i] > inventory.slots then return false end
    end

    for cellSlot, occupiedItem in pairs(inventory.items) do
        if cellSlot ~= ignoreSlot and Grid.isTetrisSlot(inventory, cellSlot) then
            local ow, oh = Grid.getItemSize(occupiedItem.name)
            local otherCells = Grid.getOccupiedCells(cellSlot, ow, oh)

            if otherCells then
                for i = 1, #otherCells do
                    for j = 1, #cells do
                        if otherCells[i] == cells[j] then
                            return false
                        end
                    end
                end
            end
        end
    end

    return true
end

return Grid