return {
	['bandage'] = {
		label = 'Bandage',
		weight = 115,
		rarity = 'incomum',
		client = {
			anim = { dict = 'missheistdockssetup1clipboard@idle_a', clip = 'idle_a', flag = 49 },
			prop = { model = `prop_rolled_sock_02`, pos = vec3(-0.14, -0.14, -0.08), rot = vec3(-50.0, -50.0, 0.0) },
			disable = { move = true, car = true, combat = true },
			usetime = 2500,
		}
	},

	['black_money'] = {
		label = 'Dirty Money',
	},

	['burger'] = {
		label = 'Burger',
		weight = 220,
		rarity = 'comum',
		client = {
			status = { hunger = 200000 },
			anim = 'eating',
			prop = 'burger',
			usetime = 2500,
			notification = 'You ate a delicious burger'
		},
	},

	['sprunk'] = {
		label = 'Sprunk',
		weight = 350,
		rarity = 'comum',
		client = {
			status = { thirst = 200000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_ld_can_01`, pos = vec3(0.01, 0.01, 0.06), rot = vec3(5.0, 5.0, -180.5) },
			usetime = 2500,
			notification = 'You quenched your thirst with a sprunk'
		}
	},

	['parachute'] = {
		label = 'Parachute',
		weight = 8000,
		stack = false,
		rarity = 'epico',
		grid = { width = 2, height = 3 },
		client = {
			anim = { dict = 'clothingshirt', clip = 'try_shirt_positive_d' },
			usetime = 1500
		}
	},

	['garbage'] = {
		label = 'Garbage',
	},

	['paperbag'] = {
		label = 'Paper Bag',
		weight = 1,
		stack = false,
		close = false,
		consume = 0,
		rarity = 'incomum'
	},

	['identification'] = {
		label = 'Identification',
		rarity = 'comum',
		client = {
			image = 'card_id.png'
		}
	},

	['lockpick'] = {
		label = 'Lockpick',
		weight = 160,
		rarity = 'lendario',
	},

	['money'] = {
		label = 'Money',
	},

	['water'] = {
		label = 'Water',
		weight = 500,
		rarity = 'comum',
		client = {
			status = { thirst = 200000 },
			anim = { dict = 'mp_player_intdrink', clip = 'loop_bottle' },
			prop = { model = `prop_ld_flow_bottle`, pos = vec3(0.03, 0.03, 0.02), rot = vec3(0.0, 0.0, -1.5) },
			usetime = 2500,
			cancel = true,
			notification = 'You drank some refreshing water'
		}
	},

	['radio'] = {
		label = 'Radio',
		weight = 1000,
		stack = false,
		allowArmed = true,
		rarity = 'raro',
	},

	['armour'] = {
		label = 'Bulletproof Vest',
		weight = 3000,
		stack = false,
		rarity = 'mitico',
		grid = { width = 2, height = 2 },
		client = {
			anim = { dict = 'clothingshirt', clip = 'try_shirt_positive_d' },
			usetime = 3500
		}
	},
	["vehiclekey"] = {
		label = "Vehicle Keys",
		description = 'This is a car key, take good care of it, if you lose it you probably won\'t be able to use your car',
		weight = 10,
		stack = false
	},

	["keybag"] = {
		label = "Key Bag",
		description = 'This is a key bag, you can store all your keys in it',
		weight = 10,
		stack = false
	},
	-- Workbench crafting materials (examples — adjust weights/rarity/labels
	-- as needed, or replace with your own item names in data/workbench_recipes.lua)
	['iron'] = { label = 'Iron', weight = 100, rarity = 'comum' },
	['steel'] = { label = 'Steel', weight = 150, rarity = 'incomum' },
	['wood'] = { label = 'Wood', weight = 200, rarity = 'comum' },

	-- Blueprint: a single generic item — which recipe(s) it grants lives in
	-- its metadata (set when the item is created, e.g. by a loot table),
	-- not in a per-blueprint item definition. See modules/workbench/server.lua
	-- for how that metadata is read, and how to generate one.
	['blueprint'] = {
		label = 'Blueprint',
		weight = 10,
		stack = false,
		close = true,
		rarity = 'raro',
		consume = 1,
	},
}
