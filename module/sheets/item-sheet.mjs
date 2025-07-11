// module/sheets/item-sheet.mjs

// Импортируем классы API
const { ItemSheet } = foundry.appv1.sheets;
const { mergeObject } = foundry.utils; // Импортируем mergeObject
const { TextEditor } = foundry.applications.ux;

/**
 * Расширенный класс ItemSheet для системы Lord of Mysteries.
 */
export class LOMLegendsItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, { // Используем импортированный mergeObject
            classes: ["lotm-rpg", "sheet", "item"],
            template: "systems/LordOfMysteries/templates/sheets/item-sheet.hbs", // Путь к файлу шаблона листа предмета
            width: 520,
            height: 480
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.system = context.item.system; // Добавляем system в контекст
        context.isGM = game.user.isGM;
        context.config = CONFIG.LOM; // Чтобы был доступ в самом шаблоне
        // Обогащаем HTML для редактора
        context.enrichedDescription = await TextEditor.enrichHTML(context.system.description.value, {
            secrets: this.item.isOwner,
            async: true
        });
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Здесь можно добавить специфичные слушатели для листа предмета
    }
}
