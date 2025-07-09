// module/documents/actor.mjs

/**
 * Расширяем базовый класс Actor для добавления специфичной логики системы.
 */
export class LOMLegendsActor extends Actor {

    /**
     * Этот метод запускается перед тем, как данные актера будут отправлены на лист.
     * Это идеальное место для расчета производных значений (модификаторов, значений навыков).
     * @override
     */
    prepareData() {
        super.prepareData();

        // Получаем данные системы актера
        const actorData = this.system;

        // Рассчитываем модификаторы атрибутов
        for (let [key, attr] of Object.entries(actorData.attributes)) {
            attr.mod = Math.floor((Number(attr.value) - 10) / 2);
        }

        // РАССЧИТЫВАЕМ ЗНАЧЕНИЯ НАВЫКОВ СОГЛАСНО УТОЧНЕННЫМ ПРАВИЛАМ
        if (CONFIG.LOM && CONFIG.LOM.skills) {
            for (let [key, skill] of Object.entries(actorData.skills)) {
                const skillConfig = CONFIG.LOM.skills[key];
                if (skillConfig && actorData.attributes[skillConfig.attribute]) {
                    const attributeMod = actorData.attributes[skillConfig.attribute].mod;
                    
                    if (skill.proficient) { // Если навык мастерский
                        let calculatedSkillValue = attributeMod;

                        // Компенсация до +0, если мастерский навык и результат отрицательный
                        if (calculatedSkillValue < 0) {
                            calculatedSkillValue = 0;
                        }
                        skill.value = calculatedSkillValue;
                    } else { // Если навык НЕ мастерский
                        if (attributeMod >= 0){
                            skill.value = 0; // Значение навыка равно 0, без модификатора атрибута
                        }
                        else {
                            skill.value = attributeMod
                        }
                        
                    }
                }
            }
        } else {
            console.warn("LOM | CONFIG.LOM.skills is not defined. Skill calculations may be incorrect.");
        }

        // Рассчитываем общую скорость передвижения
        const flexibilityMod = actorData.attributes.flexibility ? actorData.attributes.flexibility.mod : 0;
        actorData.movement.total = actorData.movement.base + flexibilityMod;
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();
        data.attributes = this.system.attributes;
        data.skills = this.system.skills;
        data.health = this.system.health;
        data.mentalHealth = this.system.mentalHealth;
        data.armor = this.system.armor;
        data.resources = this.system.resources;
        data.movement = this.system.movement;
        data.pathway = this.system.pathway;
        data.sequenceName = this.system.sequenceName;
        return data;
    }
}
