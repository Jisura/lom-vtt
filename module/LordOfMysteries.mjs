import { LoMActor } from "./documents/actor.mjs";
import { LoMCharacterSheet } from "./sheets/actor-sheet.mjs";
import { LOM } from "./config.mjs"; // Импортируем конфиг
import { preloadHandlebarsTemplates } from "./helpers.mjs"; // Импортируем хелпер

Hooks.once('init', async function() {
    console.log("LOTM-RPG | Initializing Lord of Mysteries RPG System");
    
    // Помещаем наш конфиг в глобальное пространство имен для доступа из других частей системы
    game.LOM = {
        LoMActor,
        config: LOM
    };

    // Assign custom classes
    CONFIG.Actor.documentClass = LoMActor;
    CONFIG.LOM = LOM; // Делаем конфиг доступным через CONFIG

    // Register sheet application
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("LordOfMysteries", LoMCharacterSheet, { 
        types: ["character"],
        makeDefault: true,
        label: "LOM.Sheet.Character"
    });

    // Вызываем предзагрузку шаблонов
    await preloadHandlebarsTemplates();
});
