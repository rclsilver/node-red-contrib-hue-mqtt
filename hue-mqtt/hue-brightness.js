module.exports = function (RED) {
    function HueBrightness(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueBrightnessMessage } = require('./utils/messages');

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({ fill: 'red', shape: 'ring', text: 'hue-brightness.node.not-configured' });
            return false;
        }

        bridge.events.on('initial', (cache) => {
            node.sendUpdates(cache);
        })

        bridge.events.on('refresh', (cache) => {
            node.sendUpdates(cache);
        })

        node.sendUpdates = (cache) => {
            if (cache.sensor) {
                cache.sensor.filter(sensor => {
                    return sensor.type === 'ZLLLightLevel';
                }).filter(sensor => {
                    return !config.sensor || sensor.id === config.sensor;
                }).forEach(sensor => {
                    const msg = new HueBrightnessMessage(sensor).msg;
                    node.send(msg);

                    if (config.sensor) {
                        node.status({ fill: 'green', shape: 'dot', text: `${msg.payload.lux} lux` });
                    } else {
                        node.status({});
                    }
                });
            }
        };
    }

    RED.nodes.registerType('hue-brightness', HueBrightness);
};
