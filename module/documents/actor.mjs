export class LoMActor extends Actor {

    /**
     * This function runs just before the actor's data is sent to the sheet.
     * It's the perfect place to calculate derived values.
     */
    prepareData() {
        super.prepareData();

        // Get the actor's data
        const actorData = this.system;

        // Calculate attribute modifiers
        for (let [key, attr] of Object.entries(actorData.attributes)) {
            attr.mod = Math.floor((attr.value - 10) / 2);
        }

        // Calculate total movement
        actorData.movement.total = actorData.movement.base + actorData.attributes.flexibility.mod;
    }
}
