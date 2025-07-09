// module/LordOfMysteries.mjs

// Import document classes
import { LOMLegendsActor } from "./documents/actor.mjs";
import { LOMLegendsItem } from "./documents/item.mjs";

// Import sheet classes
import { LOMLegendsActorSheet } from "./sheets/actor-sheet.mjs";
import { LOMLegendsItemSheet } from "./sheets/item-sheet.mjs";

// Import system configuration
import { LOM as LOMLegendsConfig } from "./config.mjs";

// Import helper for preloading templates
import { preloadHandlebarsTemplates } from "./helpers.mjs";

/* ------------------------------------ */
/* Initialize system                    */
/* ------------------------------------ */
Hooks.once('init', async function() {
    console.log('LOM | Initializing Lord of Mysteries System');

    // Assign document classes to CONFIG
    CONFIG.Actor.documentClass = LOMLegendsActor;
    CONFIG.Item.documentClass = LOMLegendsItem;

    // Assign system configuration to CONFIG.LOM
    CONFIG.LOM = LOMLegendsConfig;

    // Register actor sheets
    foundry.documents.collections.Actors.registerSheet("LordOfMysteries", LOMLegendsActorSheet, { types: ["character"], makeDefault: true });

    // Register item sheets
    foundry.documents.collections.Items.registerSheet("LordOfMysteries", LOMLegendsItemSheet, {
        types: ["item", "skill", "ability", "spell", "weapon", "armor", "equipment", "consumable"],
        makeDefault: true
    });

    // Register Handlebars helpers
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('getProperty', (obj, key) => foundry.utils.getProperty(obj, key));
    Handlebars.registerHelper('capitalize', (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

    /**
     * Handlebars helper to strip HTML tags from a string.
     * Useful for creating clean tooltips from rich text editor content.
     */
    Handlebars.registerHelper("stripTags", (html) => html ? (new DOMParser().parseFromString(html, 'text/html')).body.textContent || "" : "");
});


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

    // Improved reroll hook for better functionality and consistent chat card style
    Hooks.on("renderChatMessage", async (message, html, data) => {
        if (game.user.isGM) {
            const rerollButton = html.find("button[data-action='reroll-card']");
            if (rerollButton.length > 0) {
                rerollButton.on("click", async (event) => {
                    event.preventDefault();

                    const originalRoll = message.rolls[0];
                    if (!originalRoll) {
                        ui.notifications.warn(game.i18n.localize("LOM.Notify.OriginalRollNotFound"));
                        return;
                    }

                    const newRoll = await originalRoll.reroll({ async: true });
                    const actor = game.actors.get(message.speaker.actor);
                    const originalLabel = html.find('.roll-title').text();
                    const newLabel = `${game.i18n.localize("LOM.RerollOf")} ${originalLabel}`;

                    try {
                        // Render the new roll using the same custom template for consistency
                        const chatContent = await renderTemplate("systems/LordOfMysteries/templates/chat/roll-card.hbs", {
                            has_critical: newRoll.isCritical,
                            has_fumble: newRoll.isFumble,
                            formula: newRoll.formula,
                            label: newLabel,
                            actor: actor,
                            isGM: game.user.isGM,
                            roll: newRoll
                        });

                        // Create the new chat message
                        await ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            content: chatContent,
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            roll: newRoll,
                            sound: CONFIG.sounds.dice
                        });
                    } catch (error) {
                        console.error("Error rendering chat card:", error);
                        ui.notifications.error(game.i18n.localize("LOM.Notify.RerollFailed"));
                    }
                });
            }
        }
    });
});
