module.exports = function (RED) {
    function HueLight(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueLightMessage } = require('./utils/messages');

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({ fill: 'red', shape: 'ring', text: 'hue-light.node.not-configured' });
            return false;
        }

        node.on('input', (msg, send, done) => {
            const payload = msg.payload ? msg.payload : {};
            const light = payload.light ? payload.light : config.light;
            const lights = light ?
                bridge.client.lights.getById(light).then(light => [light]) :
                bridge.client.lights.getAll();

            lights.then(lights => {
                lights.forEach(light => {
                    // Update the state
                    if (payload.on !== undefined && light.on !== payload.on) {
                        light.on = payload.on;
                    }

                    // Toggle state
                    if (payload.toggle !== undefined) {
                        light.on = light.on ? true : false;
                    }

                    // Set brightness
                    if (payload.brightness !== undefined) {
                        if (payload.brightness < 0 || payload.brightness > 100) {
                            node.error(RED._('hue-light.node.error-invalid-brightness'));
                            return false;
                        }

                        if (payload.brightness === 0) {
                            light.on = false;
                        } else {
                            light.on = true;
                            light.brightness = Math.round((254 / 100) * parseInt(payload.brightness));
                        }
                    }

                    // Set color
                    if (light.xy !== undefined && payload.xy !== undefined) {
                        light.xy = payload.xy;
                    }

                    // Set saturation
                    if (light.saturation !== undefined && payload.saturation !== undefined) {
                        if (payload.saturation < 0 || payload.saturation > 100) {
                            node.error(RED._('hue-light.node.error-invalid-saturation'));
                            return false;
                        }

                        light.saturation = Math.round((254 / 100) * parseInt(payload.saturation));
                    }

                    // Set color temperature
                    if (light.colorTemp !== undefined && payload.colorTemp !== undefined) {
                        const colorTemp = parseInt(payload.colorTemp);

                        if (colorTemp < 153 || colorTemp > 500) {
                            node.error(RED._('hue-light.node.error-invalid-color-temp'));
                            return false;
                        }

                        light.colorTemp = colorTemp;
                    }

                    const changesCount = Object.keys(light.state.changed).length;

                    if (changesCount) {
                        node.debug(`${changesCount} change(s) required on light ${light}: ${JSON.stringify(light.state.changed)}`);
                        return bridge.client.lights.save(light);
                    }
                });

                if (done) {
                    done();
                }
            }).catch(error => {
                node.status({ fill: 'red', shape: 'ring', text: 'hue-light.node.error-change-state' });
                node.error(error);

                if (done) {
                    done(error);
                }
            });
        });

        bridge.events.on('initial', cache => {
            if ('light' in cache) {
                cache.light.forEach(light => {
                    if (!config.light || config.light == light.id) {
                        node.send(new HueLightMessage(light).msg);
                    }
                });
            }
        });

        bridge.events.on('light', light => {
            if (!config.light || config.light == light.id) {
                const msg = new HueLightMessage(light).msg;
                node.send(msg);

                if (config.light) {
                    if (!msg.payload.reachable) {
                        node.status({ fill: 'grey', shape: 'ring', text: 'hue-light.node.unreachable' });
                    } else if (msg.payload.on) {
                        node.status({ fill: 'green', shape: 'dot', text: 'hue-light.node.on' });
                    } else {
                        node.status({ fill: 'red', shape: 'dot', text: 'hue-light.node.off' });
                    }
                } else {
                    node.status({});
                }
            }
        });
    }

    RED.nodes.registerType('hue-light', HueLight);
};
