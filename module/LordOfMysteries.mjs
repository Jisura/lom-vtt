// module/LordOfMysteries.mjs

// Импортируем классы документов (Actor, Item)
import { LOMLegendsActor } from "./documents/actor.mjs";
import { LOMLegendsItem } from "./documents/item.mjs";

// Импортируем классы листов (ActorSheet, ItemSheet)
import { LOMLegendsActorSheet } from "./sheets/actor-sheet.mjs";
import { LOMLegendsItemSheet } from "./sheets/item-sheet.mjs";

// Импортируем конфигурацию системы
import { LOM as LOMLegendsConfig } from "../config.mjs";

// Импортируем хелпер для предзагрузки шаблонов
import { preloadHandlebarsTemplates } from "../helpers.mjs";

// Импортируем getProperty из foundry.utils для использования в Handlebars хелпере
import { getProperty } from "../node_modules/foundry-vtt-types/src/foundry/common/utils/helpers.d.ts"; // <--- ИСПРАВЛЕНО: ПУТЬ К getProperty

/* ------------------------------------ */
/* Initialize system                    */
/* ------------------------------------ */
Hooks.once('init', async function() {
    console.log('LOM | Initializing Lord of Mysteries System');

    // Присваиваем наши классы документов в CONFIG
    CONFIG.Actor.documentClass = LOMLegendsActor;
    CONFIG.Item.documentClass = LOMLegendsItem;

    // Присваиваем нашу конфигурацию в CONFIG.LOM для глобального доступа
    CONFIG.LOM = LOMLegendsConfig;

    // Регистрируем листы для актеров
    foundry.documents.collections.Actors.registerSheet("LordOfMysteries", LOMLegendsActorSheet, { types: ["character"], makeDefault: true });

    // Регистрируем листы для предметов
    foundry.documents.collections.Items.registerSheet("LordOfMysteries", LOMLegendsItemSheet, {
        types: ["item", "skill", "ability", "spell", "weapon", "armor", "equipment", "consumable"],
        makeDefault: true
    });

    // Регистрируем хелперы для Handlebars
    Handlebars.registerHelper('eq', (a, b) => a === b);
    
    // ИСПОЛЬЗУЕМ ИМПОРТИРОВАННЫЙ getProperty
    Handlebars.registerHelper('getProperty', (obj, key) => getProperty(obj, key));
});

/* ------------------------------------ */
/* Setup system                         */
/* ------------------------------------ */
Hooks.once('setup', function() {
    // Предзагружаем шаблоны Handlebars
    preloadHandlebarsTemplates();
});

/* ------------------------------------ */
/* When ready                           */
/* ------------------------------------ */
Hooks.once('ready', function() {
    console.log('LOM | Lord of Mysteries System is Ready!');
});
