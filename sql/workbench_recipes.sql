-- Run this once against your database (the same one QBox/QBCore uses).
-- Stores which workbench recipes (data/workbench_recipes.lua) each
-- character has unlocked via a blueprint item.

CREATE TABLE IF NOT EXISTS `ox_player_recipes` (
    `citizenid`   VARCHAR(50) NOT NULL,
    `recipe`      VARCHAR(50) NOT NULL,
    `unlocked_at` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`citizenid`, `recipe`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
