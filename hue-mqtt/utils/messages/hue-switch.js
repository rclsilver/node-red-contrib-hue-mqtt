const moment = require('moment');

module.exports = class HueSwitchMessage {
    constructor(sensor) {
        const buttonName = this.getButtonName(sensor.state.buttonEvent);
        const buttonAction = this.getButtonAction(sensor.state.buttonEvent);

        this.message = {
            payload: {
                button: sensor.state.buttonEvent,
                name: buttonName,
                action: buttonAction,
                updated: moment.utc(sensor.state.lastUpdated).local().format(),
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
                },
            }
        };
    }

    getButtonName(event) {
        if (event < 2000) {
            return 'on';
        }
        else if (event < 3000) {
            return 'dim_up';
        }
        else if (event < 4000) {
            return 'dim_down';
        }
        else {
            return 'off';
        }
    }

    getButtonAction(event) {
        const action = parseInt(event.toString().substring(3));

        if (action == 0) {
            return 'pressed';
        }
        else if (action == 1) {
            return 'holded';
        }
        else if (action == 2) {
            return 'short_release';
        }
        else {
            return 'long_release';
        }
    }

    get msg() {
        return this.message;
    }
};
