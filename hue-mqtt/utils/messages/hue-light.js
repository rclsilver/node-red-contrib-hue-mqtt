const moment = require('moment');
const rgb = require('../rgb');
const rgbHex = require('rgb-hex');

module.exports = class HueLightMessage {
    constructor(light) {
        this.message = {
            payload: {
                on: (light.reachable) ? light.on : false,
                brightness: (light.reachable) ? ((light.brightness) ? Math.round((100 / 254) * light.brightness) : -1) : 0,
                brightnessLevel: (light.reachable) ? light.brightness : 0,
                reachable: light.reachable,
                updated: moment().format(),
            },

            info: {
                id: light.id,
                uniqueId: light.uniqueId,
                name: light.name,
                type: light.type,
                softwareVersion: light.softwareVersion,
            }
        };

        if (light.modelId) {
            this.message.info.model = {
                id: light.model.id,
                manufacturer: light.model.manufacturer,
                name: light.model.name,
                type: light.model.type,
                colorGamut: light.model.colorGamut,
                friendsOfHue: light.model.friendsOfHue,
            };
        }

        if (light.xy) {
            const rgbColor = rgb.convertXYtoRGB(light.xy[0], light.xy[1], light.brightness);

            this.message.payload.rgb = rgbColor;
            this.message.payload.hex = rgbHex(rgbColor[0], rgbColor[1], rgbColor[2]);
        }

        if (light.colorTemp) {
            this.message.payload.colorTemp = light.colorTemp;
        }
    }

    get msg() {
        return this.message;
    }
};
