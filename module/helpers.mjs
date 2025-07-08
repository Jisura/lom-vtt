// helpers.mjs

/**
 * Preloads all of the Handlebars templates for the Lord of Mysteries system.
 * @returns {Promise<Function[]>} A promise that resolves when all templates are loaded.
 */
export const preloadHandlebarsTemplates = async function() {
    const templatePaths = [
        "systems/LordOfMysteries/templates/sheets/actor-sheet.hbs",
        "systems/LordOfMysteries/templates/sheets/item-sheet.hbs",
        "systems/LordOfMysteries/templates/chat/roll-card.hbs"
    ];

    // ÈÑÏÎËÜÇÓÅÌ ÍÎÂÛÉ API
    return foundry.applications.handlebars.loadTemplates(templatePaths);
}
