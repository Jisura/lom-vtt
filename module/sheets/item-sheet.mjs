// module/sheets/item-sheet.mjs

// --- CORRECTED: Use the appv1 API to match the ActorSheet ---
const { ItemSheet } = foundry.appv1.sheets;
const { mergeObject } = foundry.utils;

/**
 * Расширяем базовый ItemSheet для предметов системы Lord of Mysteries, используя appv1.
 */
export class LOMLegendsItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["lotm-rpg", "sheet", "item"],
            template: "systems/LordOfMysteries/templates/sheets/item-sheet.hbs",
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /**
     * @override
     * Dynamically selects the template file based on the item's type.
     */
    get template() {
        if (this.item.type === "ability") {
            return "systems/LordOfMysteries/templates/sheets/ability-sheet.hbs";
        }
        return "systems/LordOfMysteries/templates/sheets/item-sheet.hbs";
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.system = context.item.system;
        context.isGM = game.user.isGM;
        context.config = CONFIG.LOM;
        return context;
    }

    /**
     * @override
     * REQUIRED FOR APPV1: Defines how to render the sheet's HTML.
     * @param {object} context      The data from getData()
     * @returns {Promise<HTMLElement>
    } The rendered HTML element.
    */
    async _renderHTML(context) {
    return renderTemplate(this.template, context);
    }

    /**
    * @override
    * REQUIRED FOR APPV1: Defines how to replace the sheet's content when re-rendering.
    * @param {HTMLElement} newHTML     The new HTML element from _renderHTML.
    */
    _replaceHTML(newHTML) {
    this.element.empty().append(newHTML);
    }

    /** @override */
    activateListeners(html) {
    super.activateListeners(html);
    // Add specific listeners for the item sheet here if needed
    }
    }
