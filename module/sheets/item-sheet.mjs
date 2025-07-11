// module/sheets/item-sheet.mjs

// ����������� ������ API
const { ItemSheet } = foundry.appv1.sheets;
const { mergeObject } = foundry.utils; // ����������� mergeObject
const { TextEditor } = foundry.applications.ux;

/**
 * ����������� ����� ItemSheet ��� ������� Lord of Mysteries.
 */
export class LOMLegendsItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, { // ���������� ��������������� mergeObject
            classes: ["lotm-rpg", "sheet", "item"],
            template: "systems/LordOfMysteries/templates/sheets/item-sheet.hbs", // ���� � ����� ������� ����� ��������
            width: 520,
            height: 480
        });
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        context.system = context.item.system; // ��������� system � ��������
        context.isGM = game.user.isGM;
        context.config = CONFIG.LOM; // ����� ��� ������ � ����� �������
        // ��������� HTML ��� ���������
        context.enrichedDescription = await TextEditor.enrichHTML(context.system.description.value, {
            secrets: this.item.isOwner,
            async: true
        });
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // ����� ����� �������� ����������� ��������� ��� ����� ��������
    }
}
