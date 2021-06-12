const moment = require('moment');
const rgb = require('../rgb');
const rgbHex = require('rgb-hex');

module.exports = class HueGroupMessage {
    constructor(group, scene = undefined) {
        this.message = {
            payload: {
                on: group.on,
                allOn: group.allOn,
                anyOn: group.anyOn,
                brightness: Math.round((100 / 254) * group.brightness),
                brightnessLevel: group.brightness,
                updated: moment().format(),
            },

            info: {
                id: group.id,
                lightIds: group.lightIds,
                name: group.name,
                type: group.type,
                class: group.class,
            }
        };

        if (group.modelId !== undefined) {
            this.message.info.model = {
                id: group.model.id,
                uniqueId: group.uniqueId,
                manufacturer: group.model.manufacturer,
                name: group.model.name,
                type: group.model.type,
            };
        }

        if (group.xy) {
            const rgbColor = rgb.convertXYtoRGB(group.xy[0], group.xy[1], group.brightness);

            this.message.payload.rgb = rgbColor;
            this.message.payload.hex = rgbHex(rgbColor[0], rgbColor[1], rgbColor[2]);
        }

        if (group.colorTemp) {
            this.message.payload.colorTemp = group.colorTemp;
        }

        if (scene) {
            this.message.payload.scene = {
                id: scene.id,
                name: scene.name,
                owner: scene.owner,
                appData: scene.appData,
                lastUpdated: moment.utc(scene.lastUpdated).local().format(),
                version: scene.version,
            };
        }
    }

    get msg() {
        return this.message;
    }
};
