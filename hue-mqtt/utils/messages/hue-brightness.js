const moment = require('moment');

module.exports = class HueBrightnessMessage {
    constructor(sensor) {
        const lux = Math.round(
            Math.pow(10, (sensor.state.lightLevel - 1) / 10000.0)
        );

        this.message = {
            payload: {
                lux: lux,
                lightLevel: sensor.state.lightLevel,
                dark: sensor.state.dark,
                daylight: sensor.state.daylight,
                updated: moment.utc(sensor.state.lastUpdated).local().format(),
            },

            type: 'brightness',

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
