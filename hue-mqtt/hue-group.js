module.exports = function (RED) {
    function HueGroup(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueGroupMessage } = require('./utils/messages');

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({ fill: 'red', shape: 'ring', text: 'hue-group.node.not-configured' });
            return false;
        }

        node.on('input', (msg, send, done) => {
            const payload = msg.payload ? msg.payload : {};
            const group = payload.group ? payload.group : config.group;
            const groups = group ?
                bridge.client.groups.getById(group).then(group => [group]) :
                bridge.client.groups.getAll();

            groups.then(groups => {
                groups.forEach(group => {
                    // Update the state
                    if (payload.on !== undefined && group.on !== payload.on) {
                        group.on = payload.on;
                    }

                    // Toggle state
                    if (payload.toggle !== undefined) {
                        group.on = group.on ? true : false;
                    }

                    // Set brightness
                    if (payload.brightness !== undefined) {
                        if (payload.brightness < 0 || payload.brightness > 100) {
                            node.error(RED._('hue-group.node.error-invalid-brightness'));
                            return false;
                        }

                        if (payload.brightness === 0) {
                            group.on = false;
                        } else {
                            group.on = true;
                            group.brightness = Math.round((254 / 100) * parseInt(payload.brightness));
                        }
                    }

                    // Set color
                    if (group.xy !== undefined && payload.xy !== undefined) {
                        group.xy = payload.xy;
                    }

                    // Set saturation
                    if (group.saturation !== undefined && payload.saturation !== undefined) {
                        if (payload.saturation < 0 || payload.saturation > 100) {
                            node.error(RED._('hue-group.node.error-invalid-saturation'));
                            return false;
                        }

                        group.saturation = Math.round((254 / 100) * parseInt(payload.saturation));
                    }

                    // Set color temperature
                    if (group.colorTemp !== undefined && payload.colorTemp !== undefined) {
                        const colorTemp = parseInt(payload.colorTemp);

                        if (colorTemp < 153 || colorTemp > 500) {
                            node.error(RED._('hue-group.node.error-invalid-color-temp'));
                            return false;
                        }

                        group.colorTemp = colorTemp;
                    }

                    const changesCount = Object.keys(group.action.changed).length;

                    if (changesCount) {
                        node.debug(`${changesCount} change(s) required on group ${group}: ${JSON.stringify(group.action.changed)}`);
                        return bridge.client.groups.save(group);
                    }
                });

                if (done) {
                    done();
                }
            }).catch(error => {
                node.status({ fill: 'red', shape: 'ring', text: 'hue-group.node.error-input' });
                if (done) {
                    done(error);
                }
            });
        });

        bridge.events.on('group', group => {
            if (!config.group || config.group == group.id) {
                const msg = new HueGroupMessage(group).msg;
                node.send(msg);

                if (config.group) {
                    if (msg.payload.on) {
                        node.status({ fill: 'green', shape: 'dot', text: 'hue-group.node.on' });
                    } else {
                        node.status({ fill: 'red', shape: 'dot', text: 'hue-group.node.off' });
                    }
                } else {
                    node.status({});
                }
            }
        });
    }

    RED.nodes.registerType('hue-group', HueGroup);
};
