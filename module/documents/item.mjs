// module/documents/item.mjs

/**
 * Расширенный класс документа Item для добавления специфичной логики системы.
 */
export class LOMLegendsItem extends Item {

    /**
     * Обработка броска предмета.
     */
    async roll() {
        console.log(`LOM | Rolling item: ${this.name}`);

        const itemData = this.system;
        let baseFormula = "";
        let rollLabel = "";
        let isRollable = false;

        // Определяем базовую формулу и метку в зависимости от типа предмета
        if (this.type === "weapon" && itemData.damage?.value) {
            baseFormula = itemData.damage.value;
            rollLabel = game.i18n.localize("LOM.Roll.WeaponDamage");
            isRollable = true;
        } else if (this.type === "spell" && itemData.spellAttack?.value) {
            baseFormula = itemData.spellAttack.value;
            rollLabel = game.i18n.localize("LOM.Roll.SpellAttack");
            isRollable = true;
        } else if (this.type === "ability" && itemData.rollFormula?.value) {
            baseFormula = itemData.rollFormula.value;
            rollLabel = this.name; // Для способностей используем их имя
            isRollable = true;
        }

        if (!isRollable) {
            ui.notifications.info(game.i18n.localize("LOM.Notify.ItemNotDirectlyRollable").replace("{itemName}", this.name));
            return;
        }

        // Собираем полную формулу
        let fullFormula = baseFormula;
        const attributeKey = itemData.rollAttribute;
        if (attributeKey && this.actor) {
            // Добавляем модификатор, если он выбран
            fullFormula += ` + @attributes.${attributeKey}.mod`;
        }

        const rollData = this.actor ? this.actor.getRollData() : {};
        const roll = new Roll(fullFormula, rollData);
        await roll.evaluate();

        const finalLabel = rollLabel
            .replace("{actorName}", this.actor ? this.actor.name : "Unknown Actor")
            .replace("{itemName}", this.name);

        const chatData = {
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: await foundry.applications.handlebars.renderTemplate("systems/LordOfMysteries/templates/chat/roll-card.hbs", {
                roll: roll,
                actor: this.actor,
                label: finalLabel,
                formula: fullFormula, // Показываем полную формулу в чате
                isGM: game.user.isGM
            }),
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: roll,
            sound: CONFIG.sounds.dice
        };
        ChatMessage.create(chatData);
    }
}