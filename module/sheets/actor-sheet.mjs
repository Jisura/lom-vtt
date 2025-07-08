import { LoMActor } from "../documents/actor.mjs";

export class LoMCharacterSheet extends ActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["lotm-rpg", "sheet", "actor", "character"],
            template: "systems/LordOfMysteries/templates/sheets/actor-sheet.hbs", 
            width: 950, 
            height: 850, 
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
            draggable: true,
            resizable: true
        });
    }

    async getData() {
        const context = await super.getData();
        context.system = this.actor.system;
        context.isGM = game.user.isGM;
        
        context.config = CONFIG.LOM;

        this._prepareItems(context);

        context.biographyHTML = await TextEditor.enrichHTML(context.system.biography, {
            secrets: this.actor.isOwner,
            async: true
        });
        
        return context;
    }
    
    _prepareItems(context) {
        const inventory = {
            weapon: { label: "LOM.Item.Type.Weapon", items: [] },
            armor: { label: "LOM.Item.Type.Armor", items: [] },
            equipment: { label: "LOM.Item.Type.Equipment", items: [] },
            consumable: { label: "LOM.Item.Type.Consumable", items: [] },
            ability: { label: "LOM.Item.Type.Ability", items: [] }
        };

        for (let i of context.actor.items) {
            if (i.type in inventory) {
                i.img = i.img || DEFAULT_TOKEN;
                inventory[i.type].items.push(i);
            }
        }
        context.inventory = Object.values(inventory);
    }

    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;

        html.find('.rollable').click(this._onRoll.bind(this));
        
        html.find('.sequence-header').click(ev => {
            const header = $(ev.currentTarget);
            const content = header.siblings('.ability-list');
            content.slideToggle(200);
            header.find('i').toggleClass('fa-chevron-right fa-chevron-down');
        });
        
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        html.find('.item-edit, .ability-item[data-action="edit-item"]').click(this._onItemEdit.bind(this));

        html.find('.resource-counter').mousedown(this._onResourceClick.bind(this));
        html.find('.control-button[data-action="manual-set-resource"]').click(this._onManualSetResource.bind(this));
        html.find('.control-button[data-action="edit-max-resource"]').click(this._onEditMaxResource.bind(this));
    }

    /**
     * НОВЫЙ МЕТОД: Обработка перетаскивания предметов на лист.
     * @override
     */
    async _onDropItem(event, data) {
        if (!this.isEditable) return;

        const item = await Item.fromDropData(data);
        if (!item) return;

        const itemData = item.toObject();

        return await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let rollFormula = "1d20";
        let flavorText = "";
        let modifier = 0;

        if (dataset.attributeKey) {
            const attrKey = dataset.attributeKey;
            const attribute = this.actor.system.attributes[attrKey];
            if (!attribute) return console.error(`Attribute ${attrKey} not found!`);
            modifier = attribute.mod;
            flavorText = `Проверка характеристики: <strong>${attribute.label}</strong>`;
        } else if (dataset.skillKey) {
            const skillKey = dataset.skillKey;
            const skill = this.actor.system.skills[skillKey];
            if (!skill) return console.error(`Skill ${skillKey} not found!`);
            flavorText = `Проверка навыка: <strong>${skill.label}</strong>`;
            
            if (skill.proficient) {
                const attribute = this.actor.system.attributes[skill.attribute];
                if (!attribute) return console.error(`Attribute ${skill.attribute} for skill ${skillKey} not found!`);
                modifier = attribute.mod;
            } else {
                modifier = 0;
            }
        }

        rollFormula += ` + ${modifier}`;
        const roll = new Roll(rollFormula, this.actor.getRollData());
        await roll.evaluate({ async: true });
        roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: flavorText });
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
            title: `Set Value for ${resourcePath.split('.').pop()}`,
            content: `<div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <input type="number" value="${currentValue}" style="width: 80px; text-align: center;"/>
                        ${maxValue !== undefined ? `<span> / ${maxValue}</span>` : ''}
                      </div>`,
            buttons: {
                set: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Set",
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
        const itemData = { name: `New ${type.capitalize()}`, type: type };
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
}
