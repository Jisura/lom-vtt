// module/documents/item.mjs

/**
 * ��������� ������� ����� Item ��� ���������� ����������� ������ �������.
 */
export class LOMLegendsItem extends Item {

    /**
     * @override
     * �������������� ������ ��� �������� ����� ��� ��������������.
     * ��� ��������� ����� ��� ��������� �������� �� ���������.
     */
    prepareData() {
        // ����������� �������� ������������ �����
        super.prepareData();

        // ��������� ������ ������ ��� ������������ (abilities)
        if (this.type !== 'ability') return;

        const system = this.system;

        // ������������� �������� �� ���������, ���� ��� �� ������
        // ��� ������� ��� �������� ����� ������������.
        system.sequence = system.sequence ?? 9;
        system.level = system.level ?? 0;
        system.description = system.description ?? "";
    }

    /**
     * ��������� ������ ��� �������� ���������� ������ � ���.
     * @param {Roll} roll - ������ ������.
     * @param {string} label - ��������� ��� �������� � ����.
     * @private
     */
    async _sendRollToChat(roll, label) {
        const chatData = {
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: await renderTemplate("systems/LordOfMysteries/templates/chat/roll-card.hbs", {
                roll: roll,
                actor: this.actor,
                label: label,
                formula: roll.formula,
                isGM: game.user.isGM
            }),
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            roll: roll,
            sound: CONFIG.sounds.dice
        };
        await ChatMessage.create(chatData);
    }

    /**
     * ������������ ������ ��������, ��������� ��������� � ���.
     * ��������� ��� ��������� ������ ����� ���������.
     */
    async roll() {
        console.log(`LOM | Rolling item: ${this.name}`);
        
        let rollFormula;
        let rollLabel;
        const rollData = this.actor ? this.actor.getRollData() : {};

        // ���������� ������� � ��������� � ����������� �� ���� ��������
        if (this.type === "weapon" && this.system.damage?.value) {
            rollFormula = this.system.damage.value;
            rollLabel = game.i18n.localize("LOM.Roll.WeaponDamage").replace("{itemName}", this.name);
        } else if (this.type === "spell" && this.system.spellAttack?.value) {
            rollFormula = this.system.spellAttack.value;
            rollLabel = game.i18n.localize("LOM.Roll.SpellAttack").replace("{itemName}", this.name);
        } else if (this.type === "ability") {
            // ��� ������������ �� �� ������ ������, � ������ ������� �� �������� � ���.
            const chatContent = await renderTemplate("systems/LordOfMysteries/templates/chat/ability-card.hbs", {
                actor: this.actor,
                item: this,
                label: this.name
            });
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: chatContent
            });
            return; // ������� �� �������, ��� ��� ������ ���
        }

        // ���� ������� �� ����������, ������� �� �������� "���������"
        if (!rollFormula) {
            ui.notifications.info(game.i18n.localize("LOM.Notify.ItemNotDirectlyRollable").replace("{itemName}", this.name));
            return;
        }

        // �������, ��������� � ���������� ������ � ���
        const roll = new Roll(rollFormula, rollData);
        await roll.evaluate({async: true});
        await this._sendRollToChat(roll, rollLabel);
    }
}
