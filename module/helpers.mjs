/**
 * Preloads all of the Handlebars templates.
 * @returns {Promise<Function[]>}
 */
export const preloadHandlebarsTemplates = async function() {
    const templatePaths = [
        "systems/LordOfMysteries/templates/sheets/actor-sheet.hbs"
    ];
    return loadTemplates(templatePaths);
}
