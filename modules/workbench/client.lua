--[[
    Physical crafting benches (ox_target). Add one entry per bench location
    — walk to the spot, print GetEntityCoords(PlayerPedId()) in the F8
    console, and paste the coords in here.
]]
local benches = {
    vec3(0.0, 0.0, 0.0), -- TODO: replace with your real bench coords
}

if GetResourceState('ox_target') == 'started' then
    for i = 1, #benches do
        exports.ox_target:addBoxZone({
            coords = benches[i],
            size = vec3(1.2, 1.2, 1.5),
            rotation = 0,
            debug = false,
            options = {
                {
                    label = 'Usar Bancada de Crafting',
                    icon = 'fas fa-hammer',
                    distance = 2.0,
                    onSelect = function()
                        exports.ox_inventory:openInventory('stash', 'workbench')
                    end,
                },
            },
        })
    end
else
    warn('ox_target não está rodando — as bancadas de crafting em modules/workbench/client.lua não foram registradas.')
end

--[[
    Alternative: instead of fixed coords, target every instance of a bench
    PROP that already exists on the map (no need to list coords one by one).
    Swap the loop above for this if that fits better — just point `models`
    at whatever prop you're using as the bench.

    exports.ox_target:addModel({`prop_tool_bench02`}, {
        {
            label = 'Usar Bancada de Crafting',
            icon = 'fas fa-hammer',
            distance = 2.0,
            onSelect = function()
                exports.ox_inventory:openInventory('stash', 'workbench')
            end,
        },
    })
]]

-- Authoritative craft: the NUI only ever tells us which recipe it *thinks*
-- matches (for a clear error message) — modules/workbench/server.lua
-- re-checks the actual grid contents itself before granting anything.
local craftErrors = {
    recipe_mismatch = 'Os itens no grid não formam mais essa receita.',
    cannot_carry = 'Você não consegue carregar o item craftado (peso).',
    error = 'Não foi possível craftar. Tente novamente.',
}

RegisterNUICallback('craftWorkbench', function(recipeName, cb)
    local success, error = lib.callback.await('ox_inventory:craftWorkbench', false, recipeName)

    if not success then
        lib.notify({ type = 'error', description = craftErrors[error] or craftErrors.error })
    end

    cb({ success = success })
end)
