// module/LordOfMysteries.mjs

// Импортируем классы документов (Actor, Item)
import { LOMLegendsActor } from "./documents/actor.mjs";
import { LOMLegendsItem } from "./documents/item.mjs";

// Импортируем классы листов (ActorSheet, ItemSheet)
import { LOMLegendsActorSheet } from "./sheets/actor-sheet.mjs";
import { LOMLegendsItemSheet } from "./sheets/item-sheet.mjs";

// Импортируем конфигурацию системы
import { LOM as LOMLegendsConfig } from "./config.mjs";

// Импортируем хелпер для предзагрузки шаблонов
import { preloadHandlebarsTemplates } from "./helpers.mjs";

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
    
    // ИСПОЛЬЗУЕМ foundry.utils.getProperty НАПРЯМУЮ
    Handlebars.registerHelper('getProperty', (obj, key) => foundry.utils.getProperty(obj, key));
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

    // ДОБАВЛЕН ХУК ДЛЯ ПЕРЕБРОСА СООБЩЕНИЙ В ЧАТЕ
    Hooks.on("renderChatMessage", (message, html, data) => {
        // Если это сообщение броска, и у нас есть кнопка переброса
        if (message.isRoll && game.user.isGM) { // Только ГМ может перебрасывать
            const rerollButton = html.find("button[data-action='reroll-card']");
            if (rerollButton.length) {
                rerollButton.click(async (event) => {
                    event.preventDefault();
                    // Используем message.rolls[0] для простоты, если предполагается один бросок на сообщение
                    const originalRoll = message.rolls[0]; 
                    
                    if (originalRoll) {
                        const newRoll = new Roll(originalRoll.formula, originalRoll.data);
                        await newRoll.evaluate();
                        
                        // Создать новое сообщение с перебросом
                        newRoll.toMessage({
                            speaker: message.speaker,
                            flavor: `${message.flavor} (Переброс)`,
                            rollMode: message.rollMode,
                            flags: { "core.canPopout": true }
                        });
                        // Если хотите обновить текущее сообщение вместо создания нового, используйте:
                        // await message.update({ rolls: [newRoll.toJSON()] });
                    } else {
                        ui.notifications.warn(game.i18n.localize("LOM.Notify.OriginalRollNotFound")); // Используем локализацию
                    }
                });
            }
        }
    });
});
