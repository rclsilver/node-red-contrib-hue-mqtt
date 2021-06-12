module.exports = function (RED) {
    function HueCache(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { MessageFactory } = require('./utils/messages');

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({ fill: 'red', shape: 'ring', text: 'hue-cache.node.not-configured' });
            return false;
        }

        node.resetStatus = (delay) => {
            if (node.resetStatusTimeout) {
                clearTimeout(node.resetStatusTimeout);
            }
            node.resetStatusTimeout = setTimeout(() => {
                node.resetStatusTimeout = undefined;
                node.status({});
            }, delay);
        };

        bridge.events.on('initial', cache => {
            for (let type of Object.keys(cache)) {
                cache[type].forEach(device => {
                    const msg = MessageFactory.fromDevice(type, device);

                    if (msg) {
                        node.send([msg.msg, null]);
                    }
                });
            }

            node.status({ fill: 'green', shape: 'dot', text: 'hue-cache.node.initialized' });

            // reset status after 3 seconds
            node.resetStatus(3000);
        });

        bridge.events.on('refresh', cache => {
            for (let type of Object.keys(cache)) {
                cache[type].forEach(device => {
                    const msg = MessageFactory.fromDevice(type, device);

                    if (msg) {
                        node.send([null, msg.msg]);
                    }
                });
            }

            node.status({ fill: 'green', shape: 'dot', text: 'hue-cache.node.refreshed' });

            // reset status after 3 seconds
            node.resetStatus(3000);
        });

        bridge.events.on('error', () => {
            node.status({ fill: 'red', shape: 'ring', text: 'hue-cache.node.error' });
        });

        node.on('input', function (msg, send, done) {
            bridge.poller.execute();

            if (done) {
                done();
            }
        });
    }

    RED.nodes.registerType('hue-cache', HueCache);
};
