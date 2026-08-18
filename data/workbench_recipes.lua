--[[
    Receitas para a bancada de trabalho 3x3 (modules/workbench).

    A `grid` (grade) possui exatamente 9 entradas, lidas da esquerda para a direita
    e de cima para baixo (a mesma ordem usada no Minecraft), p. ex.:

        1 2 3
        4 5 6
        7 8 9

    Use `false` (ou simplesmente omita itens até completar 9 entradas usando `false`)
    para uma célula vazia. O formato deve corresponder EXATAMENTE — mesmos itens,
    nas mesmas posições — para que a receita possa ser fabricada. Isso não oferece
    suporte a versões "deslocadas" do mesmo formato (p. ex., o mesmo padrão movido
    uma coluna para a direita conta como um arranjo diferente), para manter a
    verificação de correspondência simples e previsível.

    `result.count` pode ser um número fixo ou um intervalo {min, max}.
]]

return {
    {
        name = 'ak47_frame',
        label = 'AK-47 Frame',
        grid = {
            'iron', 'steel', 'iron',
            'steel', 'wood', 'steel',
            'iron', 'steel', 'iron',
        },
        result = { name = 'WEAPON_ASSAULTRIFLE', count = 1 },
    },
    {
        name = 'bandage_kit',
        label = 'Bandage Kit',
        grid = {
            false, 'wood', false,
            'wood', 'steel', 'wood',
            false, 'wood', false,
        },
        result = { name = 'bandage', count = { 2, 4 } },
    },
}
