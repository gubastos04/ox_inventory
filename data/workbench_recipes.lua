--[[
    Recipes for the 3x3 crafting workbench (modules/workbench).

    `grid` has exactly 9 entries, read left-to-right then top-to-bottom
    (same order Minecraft uses), e.g.

        1 2 3
        4 5 6
        7 8 9

    Use `false` (or simply omit down to 9 entries with `false`) for an empty
    cell. The shape must match EXACTLY — same items, in the same positions —
    for the recipe to be craftable. This does not support "shifted" versions
    of the same shape (e.g. the same pattern moved one column to the right
    counts as a different arrangement) to keep matching simple and predictable.

    `result.count` can be a flat number or a {min, max} range.
]]

return {
    {
        name = 'ak47_frame',
        label = 'AK-47 Frame',
        grid = {
            'iron',  'steel', 'iron',
            'steel', 'wood',  'steel',
            'iron',  'steel', 'iron',
        },
        result = { name = 'weapon_ak47', count = 1 },
    },
    {
        name = 'bandage_kit',
        label = 'Bandage Kit',
        grid = {
            false,  'wood',  false,
            'wood', 'steel', 'wood',
            false,  'wood',  false,
        },
        result = { name = 'bandage', count = { 2, 4 } },
    },
}
