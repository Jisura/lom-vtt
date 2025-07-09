// module/sheets/actor-sheet.mjs

import { LOMLegendsActor } from "../documents/actor.mjs";

const DEFAULT_TOKEN = "icons/svg/mystery-man.svg";

// Using the appv1 API as intended.
const { ActorSheet } = foundry.appv1.sheets;
const { getProperty, mergeObject } = foundry.utils;
const { TextEditor } = foundry.applications.ux;

export class LOMLegendsActorSheet extends ActorSheet {

    /**
     * @override
     * The designated "appv1" method for defining the initial reactive state.
     * This replaces setting state in the constructor.
     * @returns {object}
     */
    _getInitialState() {
        return {
            showPortrait: false
        };
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["lotm-rpg", "sheet", "actor", "character"],
            template: "systems/LordOfMysteries/templates/sheets/actor-sheet.hbs",
            width: 950,
            height: 850,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
            draggable: true,
            resizable: true
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.actor = context.document;
        context.system = context.document.system;
        context.isGM = game.user.isGM;
        
        this._prepareItems(context);

        context.biographyHTML = await TextEditor.enrichHTML(context.system.biography, {
            secrets: this.actor.isOwner,
            async: true
        });

        // CORRECTED: Read state from this.state (the public getter for reactive data)
        context.showPortrait = this.state.showPortrait;
        context.activeImg = this.state.showPortrait ? context.actor.system.portrait : context.actor.img;

        return context;
    }

    _prepareItems(context) {
        const inventory = {
            weapon: { label: game.i18n.localize("LOM.ItemTypeWeapon"), items: [] },
            armor: { label: game.i18n.localize("LOM.ItemTypeArmor"), items: [] },
            equipment: { label: game.i18n.localize("LOM.ItemTypeEquipment"), items: [] },
            consumable: { label: game.i18n.localize("LOM.ItemTypeConsumable"), items: [] },
            ability: { label: game.i18n.localize("LOM.ItemTypeAbility"), items: [] },
            spell: { label: game.i18n.localize("LOM.ItemTypeSpell"), items: [] }
        };
        const sequenceAbilities = {};
        for (let i of context.actor.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type in inventory) {
                inventory[i.type].items.push(i);
            }
            if (i.type === 'ability') {
                const seqNum = i.system.sequence;
                if (!sequenceAbilities[seqNum]) {
                    sequenceAbilities[seqNum] = { level: seqNum, abilities: [] };
                }
                sequenceAbilities[seqNum].abilities.push(i);
            }
        }
        context.inventory = Object.values(inventory).filter(g => g.items.length > 0);
        context.sequenceAbilities = Object.values(sequenceAbilities).sort((a, b) => b.level - a.level);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;
        html.find('[data-action="roll-item"]').click(this._onRollItem.bind(this));
        html.find('[data-action="edit-item"]').click(this._onItemEdit.bind(this));
        html.find('.rollable-attribute').click(this._onAttributeRoll.bind(this));
        html.find('.ability-create').click(this._onAbilityCreate.bind(this));
        html.find('.rollable-skill').click(this._onSkillRoll.bind(this));
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        html.find('.resource-counter').mousedown(this._onResourceClick.bind(this));
        html.find('.control-button[data-action="manual-set-resource"]').click(this._onManualSetResource.bind(this));
        html.find('.control-button[data-action="edit-max-resource"]').click(this._onEditMaxResource.bind(this));
        html.find('.sequence-header').click(ev => {
            const header = $(ev.currentTarget);
            const content = header.siblings('.ability-list');
            content.slideToggle(200);
            header.find('i').toggleClass('fa-chevron-right fa-chevron-down');
        });
        html.find('.toggle-image').click(this._onToggleImage.bind(this));
        html.find('.profile-img').click(this._onEditImage.bind(this));
    }

    _onToggleImage(event) {
        event.preventDefault();
        // CORRECTED: Write to this.reactive, read from this.state.
        // The sheet re-renders automatically.
        this.reactive.showPortrait = !this.state.showPortrait;
    }
    
    _onEditImage(event) {
        // CORRECTED: Read from this.state
        const currentImgProperty = this.state.showPortrait ? "system.portrait" : "img";
        const filePicker = new FilePicker({
            type: "image",
            current: getProperty(this.actor, currentImgProperty),
            callback: path => {
                this.actor.update({ [currentImgProperty]: path });
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return filePicker.browse();
    }

    async _onDropItem(event, data) {
        if (!this.isEditable) return false;
        const item = await Item.fromDropData(data);
        if (!item) return false;
        if (item.type === 'ability') {
            const isDuplicate = this.actor.items.some(i => i.name === item.name && i.type === 'ability');
            if (isDuplicate) {
                ui.notifications.warn(game.i18n.localize("LOM.Notify.AbilityAlreadyExists").replace("{abilityName}", item.name));
                return false;
            }
        }
        return await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
    }

    async _onAttributeRoll(event) {
        event.preventDefault();
        const attributeKey = event.currentTarget.dataset.attributeKey;
        const attribute = this.actor.system.attributes[attributeKey];
        if (!attribute) return;
        const rollFormula = `1d20 + ${attribute.mod}`;
        const rollLabel = `Проверка: ${attribute.label}`;
        const roll = new Roll(rollFormula, this.actor.getRollData());
        await roll.evaluate();
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

    async _onSkillRoll(event) {
        event.preventDefault();
        const skillKey = event.currentTarget.dataset.skillKey;
        const skill = this.actor.system.skills[skillKey];
        if (!skill) return;
        const rollFormula = `1d20 + ${skill.value}`;
        const rollLabel = `Проверка: ${skill.label}`;
        const roll = new Roll(rollFormula, this.actor.getRollData());
        await roll.evaluate();
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

    async _onRollItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest("[data-item-id]").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;
        if (typeof item.roll === 'function') {
            item.roll();
        } else {
            ui.notifications.warn(game.i18n.localize("LOM.Notify.ItemNotRollable").replace("{itemName}", item.name));
        }
    }

    async _onResourceClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        if (event.target.closest('.control-button')) return;
        const resourcePath = element.dataset.resourcePath;
        if (!resourcePath) return;
        let currentValue = getProperty(this.actor, `${resourcePath}.value`);
        if (typeof currentValue !== 'number') return;
        const change = event.shiftKey ? 5 : 1;
        let newValue = (event.button === 0) ? currentValue + change : currentValue - change;
        if (newValue < 0) newValue = 0;
        if (resourcePath === "system.health" || resourcePath === "system.mentalHealth") {
            const maxValue = getProperty(this.actor, `${resourcePath}.max`);
            if (newValue > maxValue) newValue = maxValue;
        }
        await this.actor.update({ [`${resourcePath}.value`]: newValue });
    }

    async _onManualSetResource(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const resourceContainer = element.closest('.resource-counter');
        const resourcePath = resourceContainer.dataset.resourcePath;
        if (!resourcePath) return;
        const currentValue = getProperty(this.actor, `${resourcePath}.value`);
        const maxPath = `${resourcePath}.max`;
        const maxValue = getProperty(this.actor, maxPath);
        const dialog = new Dialog({
            title: game.i18n.localize("LOM.ManualSetValueTitle").replace("{resourceName}", resourcePath.split('.').pop()),
            content: `<div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <input type="number" value="${currentValue}" style="width: 80px; text-align: center;"/>
                        ${maxValue !== undefined ? `<span> / ${maxValue}</span>` : ''}
                      </div>`,
            buttons: {
                set: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("LOM.Set"),
                    callback: (html) => {
                        let newValue = parseInt(html.find('input').val());
                        if (isNaN(newValue)) return;
                        if (newValue < 0) newValue = 0;
                        if (maxValue !== undefined && newValue > maxValue) newValue = maxValue;
                        this.actor.update({ [`${resourcePath}.value`]: newValue });
                    }
                }
            },
            default: "set"
        });
        dialog.render(true);
    }

    async _onEditMaxResource(event) {
        event.preventDefault();
        if (!game.user.isGM) return;
        const element = event.currentTarget;
        const resourceContainer = element.closest('.resource-counter');
        const resourcePath = resourceContainer.dataset.resourcePath;
        const change = parseInt(element.dataset.change);
        if (!resourcePath || isNaN(change)) return;
        const maxPath = `${resourcePath}.max`;
        let maxValue = getProperty(this.actor, maxPath);
        if (typeof maxValue !== 'number') return;
        let newMax = maxValue + change;
        if (newMax < 0) newMax = 0;
        await this.actor.update({ [maxPath]: newMax });
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = { name: `${game.i18n.localize("LOM.New")} ${type.capitalize()}`, type: type };
        return await Item.create(itemData, {parent: this.actor});
    }

    async _onItemEdit(event) {
        event.preventDefault();
        const li = event.currentTarget.closest("[data-item-id]");
        const item = this.actor.items.get(li.dataset.itemId);
        item.sheet.render(true);
    }

    async _onItemDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest("[data-item-id]");
        const item = this.actor.items.get(li.dataset.itemId);
        if (item) await item.delete();
    }

    async _onAbilityCreate(event) {
        event.preventDefault();
        let sequenceOptions = "";
        for (let i = 9; i >= 0; i--) {
            sequenceOptions += `<option value="${i}">${game.i18n.localize("LOM.Sequence")} ${i}</option>`;
        }
        const content = `
            <form>
                <div class="form-group">
                    <label>${game.i18n.localize("LOM.AbilityName")}</label>
                    <input type="text" name="name" autofocus/>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("LOM.Sequence")}</label>
                    <select name="sequence">${sequenceOptions}</select>
                </div>
            </form>
        `;
        new Dialog({
            title: game.i18n.localize("LOM.CreateAbility"),
            content: content,
            buttons: {
                create: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("LOM.Create"),
                    callback: async (html) => {
                        const form = html[0].querySelector("form");
                        const name = form.name.value;
                        const sequence = parseInt(form.sequence.value);
                        if (!name) {
                            ui.notifications.warn(game.i18n.localize("LOM.Notify.AbilityNameMissing"));
                            return;
                        }
                        const itemData = {
                            name: name,
                            type: "ability",
                            img: "systems/LordOfMysteries/assets/icons/star.svg",
                            system: {
                                sequence: sequence,
                                description: "",
                                level: 0
                            }
                        };
                        await Item.create(itemData, { parent: this.actor });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("LOM.Cancel")
                }
            },
            default: "create"
        }).render(true);
    }
}
