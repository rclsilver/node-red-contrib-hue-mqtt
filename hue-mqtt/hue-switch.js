module.exports = function (RED) {
    function HueSwitch(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueSwitchMessage } = require('./utils/messages');

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({ fill: 'red', shape: 'ring', text: 'hue-switch.node.not-configured' });
            return false;
        }

        bridge.events.on('ZLLSwitch', sensor => {
            if (!config.sensor || config.sensor == sensor.id) {
                const msg = new HueSwitchMessage(sensor).msg;
                node.send(msg);

                if (config.sensor) {
                    node.status({ fill: 'green', shape: 'dot', text: `${msg.payload.name} - ${msg.payload.action}` });

                    // reset status after 3 seconds
                    if (node.resetStatusTimeout) {
                        clearTimeout(node.resetStatusTimeout);
                    }
                    node.resetStatusTimeout = setTimeout(() => {
                        node.resetStatusTimeout = undefined;
                        node.status({});
                    }, 3000);
                } else {
                    node.status({});
                }
            }
        });
    }

    RED.nodes.registerType('hue-switch', HueSwitch);
};
