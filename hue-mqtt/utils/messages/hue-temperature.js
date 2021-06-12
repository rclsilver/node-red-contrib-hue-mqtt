const moment = require('moment');

module.exports = class HueTemperatureMessage {
    constructor(sensor) {
        const deviceValue = sensor.state.temperature * 100;
        const celsius = Math.round(sensor.state.temperature * 100) / 100;
        const fahrenheit = Math.round(((celsius * 1.8) + 32) * 100) / 100;

        this.message = {
            payload: {
                celsius: celsius,
                fahrenheit: fahrenheit,
                deviceValue: deviceValue,
                updated: moment.utc(sensor.state.lastUpdated).local().format()
            },

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
                }
            },
        };
    }

    get msg() {
        return this.message;
    }
};
