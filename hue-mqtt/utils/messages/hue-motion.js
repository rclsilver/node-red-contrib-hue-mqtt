const moment = require("moment");

module.exports = class HueMotionMessage {
    constructor(sensor, active = undefined) {
        if (active === undefined) {
            active = sensor.config.on;
        }

        this.message = {
            payload: {
                active: active,
                motion: active && sensor.state.presence ? true : false,
                updated: sensor.state.lastUpdated
                    ? moment.utc(sensor.state.lastUpdated).local().format()
                    : moment().local().format(),
            },

            type: "motion",

            info: {
                id: sensor.id,
                uniqueId: sensor.uniqueId,
                name: sensor.name,
                type: sensor.type,
                softwareVersion: sensor.softwareVersion,
                battery: sensor.config.battery,
                model: {
                    id: sensor.model.id,
                    manufacturer: sensor.model.manufacturer,
                    name: sensor.model.name,
                    type: sensor.model.type,
                },
            },
        };
    }

    get msg() {
        return this.message;
    }
};
