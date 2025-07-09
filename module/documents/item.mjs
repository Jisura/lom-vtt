// module/documents/item.mjs

/**
 * Расширяем базовый класс Item для добавления специфичной логики системы.
 */
export class LOMLegendsItem extends Item {

    /**
     * @override
     * Подготавливаем данные для предмета перед его использованием.
     * Это идеальное место для установки значений по умолчанию.
     */
    prepareData() {
        // Обязательно вызываем родительский метод
        super.prepareData();

        // Применяем логику только для способностей (abilities)
        if (this.type !== 'ability') return;

        const system = this.system;

        // Устанавливаем значения по умолчанию, если они не заданы
        // Это полезно при создании новых способностей.
        system.sequence = system.sequence ?? 9;
        system.level = system.level ?? 0;
        system.description = system.description ?? "";
    }

    /**
     * Приватный хелпер для отправки результата броска в чат.
     * @param {Roll} roll - Объект броска.
     * @param {string} label - Заголовок для карточки в чате.
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
     * Обрабатывает бросок предмета, отправляя результат в чат.
     * Расширено для поддержки разных типов предметов.
     */
    async roll() {
        console.log(`LOM | Rolling item: ${this.name}`);
        
        let rollFormula;
        let rollLabel;
        const rollData = this.actor ? this.actor.getRollData() : {};

        // Определяем формулу и заголовок в зависимости от типа предмета
        if (this.type === "weapon" && this.system.damage?.value) {
            rollFormula = this.system.damage.value;
            rollLabel = game.i18n.localize("LOM.Roll.WeaponDamage").replace("{itemName}", this.name);
        } else if (this.type === "spell" && this.system.spellAttack?.value) {
            rollFormula = this.system.spellAttack.value;
            rollLabel = game.i18n.localize("LOM.Roll.SpellAttack").replace("{itemName}", this.name);
        } else if (this.type === "ability") {
            // Для способностей мы не делаем бросок, а просто выводим их описание в чат.
            const chatContent = await renderTemplate("systems/LordOfMysteries/templates/chat/ability-card.hbs", {
                actor: this.actor,
                item: this,
                label: this.name
            });
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: chatContent
            });
            return; // Выходим из функции, так как броска нет
        }

        // Если формула не определена, предмет не является "бросаемым"
        if (!rollFormula) {
            ui.notifications.info(game.i18n.localize("LOM.Notify.ItemNotDirectlyRollable").replace("{itemName}", this.name));
            return;
        }

        // Создаем, вычисляем и отправляем бросок в чат
        const roll = new Roll(rollFormula, rollData);
        await roll.evaluate({async: true});
        await this._sendRollToChat(roll, rollLabel);
    }
}
