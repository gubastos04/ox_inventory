--[[
    Nothing fancy needed here — opening the workbench is just:

        exports.ox_inventory:openInventory('stash', 'workbench')

    Wire that to whatever you're using for interactions, e.g. ox_target:

        exports.ox_target:addBoxZone({
            coords = vec3(0, 0, 0),
            size = vec3(1, 1, 1),
            options = {
                {
                    label = 'Usar Bancada',
                    icon = 'fas fa-hammer',
                    onSelect = function()
                        exports.ox_inventory:openInventory('stash', 'workbench')
                    end,
                },
            },
        })

    The command below is just here so you can test the UI immediately
    without wiring up a physical bench first — remove it once you have
    your own trigger in place.
]]

RegisterCommand('workbench', function()
    exports.ox_inventory:openInventory('stash', 'workbench')
end, false)

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
