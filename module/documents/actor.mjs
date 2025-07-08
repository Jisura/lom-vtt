// module/documents/actor.mjs

/**
 * ��������� ������� ����� Actor ��� ���������� ����������� ������ �������.
 */
export class LOMLegendsActor extends Actor {

    /**
     * ���� ����� ����������� ����� ���, ��� ������ ������ ����� ���������� �� ����.
     * ��� ��������� ����� ��� ������� ����������� �������� (�������������, �������� �������).
     * @override
     */
    prepareData() {
        super.prepareData();

        // �������� ������ ������� ������
        const actorData = this.system;

        // ������������ ������������ ���������
        for (let [key, attr] of Object.entries(actorData.attributes)) {
            // ��������, ��� value - �����, ������ ��� ��������� �������
            attr.mod = Math.floor((Number(attr.value) - 10) / 2); // ������: (�������� - 10) / 2
        }

        // ������������ �������� �������
        // ���������� CONFIG.LOM ��� ��������� ���������� � ���, � ������ �������� ��������� �����
        // ���� CONFIG.LOM.skills ��� �� ���������, ��� ����� ������� ������.
        // ���������, ��� config.mjs ��������� ������������ LOM.skills.
        if (CONFIG.LOM && CONFIG.LOM.skills) {
            for (let [key, skill] of Object.entries(actorData.skills)) {
                const skillConfig = CONFIG.LOM.skills[key];
                if (skillConfig && actorData.attributes[skillConfig.attribute]) {
                    const attributeMod = actorData.attributes[skillConfig.attribute].mod;
                    // ������: �������� ������ = (2, ���� ����������) + ����������� ��������
                    skill.value = (skill.proficient ? 2 : 0) + attributeMod;
                }
            }
        } else {
            console.warn("LOM | CONFIG.LOM.skills is not defined. Skill calculations may be incorrect.");
        }


        // ������������ ����� �������� ������������
        // ��������, ��� flexibility.mod ����������
        const flexibilityMod = actorData.attributes.flexibility ? actorData.attributes.flexibility.mod : 0;
        actorData.movement.total = actorData.movement.base + flexibilityMod;
    }

    /**
     * ���� ����� ����������, ����� Foundry ������� "roll data" ��� �������.
     * �� ������ ���������� ������, ������� ����� ���� ����������� � �������� ������� (��������, "1d20 + @attributes.strength.value").
     * @override
     */
    getRollData() {
        // ������ � ������� ������ ������
        const data = super.getRollData();

        // ������� ������ ������� ������
        data.attributes = this.system.attributes;
        data.skills = this.system.skills;
        data.health = this.system.health;
        data.mentalHealth = this.system.mentalHealth;
        data.armor = this.system.armor;
        data.resources = this.system.resources;
        data.movement = this.system.movement;
        data.pathway = this.system.pathway;
        data.sequenceName = this.system.sequenceName;

        // ������� ������ � ���������, ���� ��� ����� � �������� (��������, ��� ����������)
        // data.items = this.items.reduce((obj, i) => {
        //     obj[i.name.slugify({strict: true})] = i.system;
        //     return obj;
        // }, {});

        return data;
    }
}
