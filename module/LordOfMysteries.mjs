// module/LordOfMysteries.mjs

// Import Document classes
import { LOMLegendsActor } from "./documents/actor.mjs";
import { LOMLegendsItem } from "./documents/item.mjs";

// Import Sheet classes
import { LOMLegendsActorSheet } from "./sheets/actor-sheet.mjs";
import { LOMLegendsItemSheet } from "./sheets/item-sheet.mjs";

// Import System configuration
import { LOM as LOMLegendsConfig } from "./config.mjs";

// Import helper functions
import { preloadHandlebarsTemplates } from "./helpers.mjs";

/* ------------------------------------ */
/* Initialize system                    */
/* ------------------------------------ */
Hooks.once('init', async function() {
    console.log('LOM | Initializing Lord of Mysteries System');

    // Assign custom Document classes to the CONFIG
    CONFIG.Actor.documentClass = LOMLegendsActor;
    CONFIG.Item.documentClass = LOMLegendsItem;

    // Assign our configuration to CONFIG.LOM for global access
    CONFIG.LOM = LOMLegendsConfig;

    // Register Actor sheets
    Actors.registerSheet("LordOfMysteries", LOMLegendsActorSheet, { types: ["character"], makeDefault: true });

    // Register Item sheets
    Items.registerSheet("LordOfMysteries", LOMLegendsItemSheet, {
        types: ["item", "skill", "ability", "spell", "weapon", "armor", "equipment", "consumable"],
        makeDefault: true
    });

    // Register all Handlebars helpers
    // --------------------------------------------------

    // Checks for equality
    Handlebars.registerHelper('eq', (a, b) => a === b);
    
    // Gets a property from an object using a string path
    Handlebars.registerHelper('getProperty', (obj, key) => foundry.utils.getProperty(obj, key));
    
    // Removes HTML tags from a string
    Handlebars.registerHelper('stripTags', function(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '');
    });

    // Concatenates multiple strings together
    Handlebars.registerHelper('concat', function(...args) {
        return args.slice(0, -1).join('');
    });

    // Capitalizes the first letter of a string
    Handlebars.registerHelper('capitalize', function(str) {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

}); // The 'init' hook correctly ends here, after all helpers are registered.

/* ------------------------------------ */
/* Setup system                         */
/* ------------------------------------ */
Hooks.once('setup', function() {
    // Preload Handlebars templates
    preloadHandlebarsTemplates();
});

/* ------------------------------------ */
/* When ready                           */
/* ------------------------------------ */
Hooks.once('ready', function() {
    console.log('LOM | Lord of Mysteries System is Ready!');

    // Hook for re-rolling from a chat message card
    Hooks.on("renderChatMessage", (message, html, data) => {
        if (message.isRoll && game.user.isGM) {
            const rerollButton = html.find("button[data-action='reroll-card']");
            if (rerollButton.length) {
                rerollButton.click(async (event) => {
                    event.preventDefault();
                    const originalRoll = message.rolls[0]; 
                    
                    if (originalRoll) {
                        const newRoll = new Roll(originalRoll.formula, originalRoll.data);
                        await newRoll.evaluate();
                        
                        // Create a new chat message with the re-roll
                        newRoll.toMessage({
                            speaker: message.speaker,
                            flavor: `${message.flavor} (Переброс)`,
                            rollMode: message.rollMode,
                            flags: { "core.canPopout": true }
                        });
                    } else {
                        ui.notifications.warn(game.i18n.localize("LOM.Notify.OriginalRollNotFound"));
                    }
                });
            }
        }
    });
});
