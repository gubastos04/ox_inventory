local Items = require 'modules.items.server'

local GRID_COLS = 7
local HOTBAR_SIZE = 7

local TETRIS_TYPES = {
    player = true,
    drop = true,
    newdrop = true,
    container = true,
    stash = true,
    trunk = true,
    glovebox = true,
}

local function isExcludedStash(invId)
    return type(invId) == 'string' and invId:find('^workbench:') ~= nil
end

local Grid = {}

---@param inventory table 
---@return boolean
function Grid.isTetrisType(inventory)
    return TETRIS_TYPES[inventory.type] == true and not isExcludedStash(inventory.id)
end

---@param itemName string
---@return integer width, integer height
function Grid.getItemSize(itemName)
    local item = Items(itemName)
    local grid = item and item.grid
    if not grid then return 1, 1 end
    return grid.width or 1, grid.height or 1
end

---@param inventory table 
---@param slot number
---@return boolean
function Grid.isTetrisSlot(inventory, slot)
    if not Grid.isTetrisType(inventory) then return false end
    if inventory.type == 'player' and slot <= HOTBAR_SIZE then return false end
    return true
end

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


---@param inventory table server-side Inventory object
---@param anchorSlot number
---@param w integer
---@param h integer
---@param ignoreSlot number
---@return boolean fits
function Grid.canPlace(inventory, anchorSlot, w, h, ignoreSlot)
    if not Grid.isTetrisSlot(inventory, anchorSlot) then

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
