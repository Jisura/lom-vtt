// module/sheets/item-sheet.mjs

// ИСПОЛЬЗУЕМ НОВЫЙ API
const { ItemSheet } = foundry.appv1.sheets;
const { mergeObject } = foundry.utils; // Импортируем mergeObject

/**
 * Расширяем базовый ItemSheet для предметов системы Lord of Mysteries.
 */
export class LOMLegendsItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, { // Используем импортированный mergeObject
            classes: ["lotm-rpg", "sheet", "item"],
            template: "systems/LordOfMysteries/templates/sheets/item-sheet.hbs", // Путь к вашему шаблону листа предмета
            width: 520,
            height: 480
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.system = context.item.system; // Упрощаем доступ к данным
        context.isGM = game.user.isGM;
        context.config = CONFIG.LOM; // Если вам нужна конфигурация в листе предмета
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Добавьте специфичные слушатели для листа предмета здесь
    }
}
