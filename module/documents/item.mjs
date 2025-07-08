// module/documents/item.mjs

/**
 * Расширяем базовый класс Item для добавления специфичной логики системы.
 */
export class LOMLegendsItem extends Item {

    /**
     * Пример метода для броска предмета.
     * Вы можете расширить его для разных типов предметов.
     */
    async roll() {
        console.log(`LOM | Rolling item: ${this.name}`);
        
        // Здесь будет логика броска для предмета.
        // Например, для оружия:
        if (this.type === "weapon" && this.system.damage && this.system.damage.value) {
            const rollFormula = this.system.damage.value;
            const rollLabel = game.i18n.localize("LOM.Roll.WeaponDamage")
                                .replace("{actorName}", this.actor ? this.actor.name : "Unknown Actor")
                                .replace("{itemName}", this.name);
            const rollData = this.actor ? this.actor.getRollData() : {}; // Получаем данные актера для броска

            const roll = new Roll(rollFormula, rollData);
            await roll.evaluate(); // ИСПРАВЛЕНО: УБРАН async: true

            const chatData = {
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: await renderTemplate("systems/LordOfMysteries/templates/chat/roll-card.hbs", {
                    roll: roll,
                    actor: this.actor,
                    label: rollLabel,
                    formula: rollFormula,
                    isGM: game.user.isGM
                }),
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                roll: roll,
                sound: CONFIG.sounds.dice
            };
            ChatMessage.create(chatData);
        } else if (this.type === "spell" && this.system.spellAttack && this.system.spellAttack.value) {
            // Логика для броска заклинания
            const rollFormula = this.system.spellAttack.value;
            const rollLabel = game.i18n.localize("LOM.Roll.SpellAttack")
                                .replace("{actorName}", this.actor ? this.actor.name : "Unknown Actor")
                                .replace("{itemName}", this.name);
            const rollData = this.actor ? this.actor.getRollData() : {};

            const roll = new Roll(rollFormula, rollData);
            await roll.evaluate(); // ИСПРАВЛЕНО: УБРАН async: true

            const chatData = {
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: await renderTemplate("systems/LordOfMysteries/templates/chat/roll-card.hbs", {
                    roll: roll,
                    actor: this.actor,
                    label: rollLabel,
                    formula: rollFormula,
                    isGM: game.user.isGM
                }),
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                roll: roll,
                sound: CONFIG.sounds.dice
            };
            ChatMessage.create(chatData);
        }
        // Добавьте логику для других типов предметов (ability, consumable и т.д.)
        else {
            ui.notifications.info(game.i18n.localize("LOM.Notify.ItemNotDirectlyRollable").replace("{itemName}", this.name));
        }
    }
}
