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
            // Убедимся, что value - число, прежде чем выполнять расчеты
            attr.mod = Math.floor((Number(attr.value) - 10) / 2); // Пример: (Значение - 10) / 2
        }

        // Рассчитываем значения навыков
        // Используем CONFIG.LOM для получения информации о том, к какому атрибуту относится навык
        // Если CONFIG.LOM.skills еще не определен, это может вызвать ошибку.
        // Убедитесь, что config.mjs правильно экспортирует LOM.skills.
        if (CONFIG.LOM && CONFIG.LOM.skills) {
            for (let [key, skill] of Object.entries(actorData.skills)) {
                const skillConfig = CONFIG.LOM.skills[key];
                if (skillConfig && actorData.attributes[skillConfig.attribute]) {
                    const attributeMod = actorData.attributes[skillConfig.attribute].mod;
                    // Пример: значение навыка = (2, если мастерство) + модификатор атрибута
                    skill.value = (skill.proficient ? 2 : 0) + attributeMod;
                }
            }
        } else {
            console.warn("LOM | CONFIG.LOM.skills is not defined. Skill calculations may be incorrect.");
        }


        // Рассчитываем общую скорость передвижения
        // Убедимся, что flexibility.mod существует
        const flexibilityMod = actorData.attributes.flexibility ? actorData.attributes.flexibility.mod : 0;
        actorData.movement.total = actorData.movement.base + flexibilityMod;
    }

    /**
     * Этот метод вызывается, когда Foundry требует "roll data" для бросков.
     * Он должен возвращать объект, который может быть использован в формулах бросков (например, "1d20 + @attributes.strength.value").
     * @override
     */
    getRollData() {
        // Начнем с базовых данных актера
        const data = super.getRollData();

        // Добавим данные системы актера
        data.attributes = this.system.attributes;
        data.skills = this.system.skills;
        data.health = this.system.health;
        data.mentalHealth = this.system.mentalHealth;
        data.armor = this.system.armor;
        data.resources = this.system.resources;
        data.movement = this.system.movement;
        data.pathway = this.system.pathway;
        data.sequenceName = this.system.sequenceName;

        // Добавим данные о предметах, если они нужны в формулах (например, для заклинаний)
        // data.items = this.items.reduce((obj, i) => {
        //     obj[i.name.slugify({strict: true})] = i.system;
        //     return obj;
        // }, {});

        return data;
    }
}
