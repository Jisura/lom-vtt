// module/documents/item.mjs

/**
 * ����������� ����� ��������� Item ��� ���������� ����������� ������ �������.
 */
export class LOMLegendsItem extends Item {

    /**
     * ��������� ������ ��������.
     */
    async roll() {
        console.log(`LOM | Rolling item: ${this.name}`);

        const itemData = this.system;
        let baseFormula = "";
        let rollLabel = "";
        let isRollable = false;

        // ���������� ������� ������� � ����� � ����������� �� ���� ��������
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
            rollLabel = this.name; // ��� ������������ ���������� �� ���
            isRollable = true;
        }

        if (!isRollable) {
            ui.notifications.info(game.i18n.localize("LOM.Notify.ItemNotDirectlyRollable").replace("{itemName}", this.name));
            return;
        }

        // �������� ������ �������
        let fullFormula = baseFormula;
        const attributeKey = itemData.rollAttribute;
        if (attributeKey && this.actor) {
            // ��������� �����������, ���� �� ������
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
                formula: fullFormula, // ���������� ������ ������� � ����
                isGM: game.user.isGM
            }),
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: roll,
            sound: CONFIG.sounds.dice
        };
        ChatMessage.create(chatData);
    }
}