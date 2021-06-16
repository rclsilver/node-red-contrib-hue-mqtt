const moment = require('moment');

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

            type: 'group',

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
            this.message.payload.xy = {
                x: group.xy[0],
                y: group.xy[1],
            };
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
